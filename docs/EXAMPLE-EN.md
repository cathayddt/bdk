# Example
[(中文版)](EXAMPLE.md)

## Index
- [Create a Blockchain Network](#create-a-blockchain-network)
- [Deploy Chaincode](#deploy-chaincode)
- [Add New Channel](#add-new-channel)
- [Add New Peer Org](#add-new-peer-org)
- [Add New Orderer Org](#add-new-orderer-org)

## Create a Blockchain Network

First of all, you'll need to prepare the file *network-create.json*, and insert the required variables into *network-create.json* . We will then use `cryptogen` to generate the certificates and keys needed for bringing up the blockchain network. Next, we'll need to start the orderer and peer instances. We'll then create an application channel and add the peers into it.

### Prerequisites

Variables required by *network-create.json* are defined in the files *configtx.yaml*, *crypto-config.yaml*, and *docker-compose.yaml*. They can be categorized as variables either for orderer organizations or peer organizations. Please move these files under *~/.bdk* directory after they have been modified.

#### `ordererOrgs`: Settings concerning the initial orderer organization on this blockchain network
- `name` organization name of the orderer org
- `domain` domain name of the orderer organization
- `enableNodeOUs` whether to define memberships explicitly (3 member types: `admin`, `orderer`, `client` instead of the original 2: `admin` and `member`)
- `hostname` number of orderers and the hostname of each orderer
- `ports` port settings of each orderer in this orderer organization
  - `port` opened port of the orderer
  - `isPublishPort` whether to publish the opened port from the Docker container
  - `operationPort` port used to check the heartbeat of the instance
  - `isPublishOperationPort` whether to publish the health-check port from the Docker container

#### `peerOrgs`: Settings concerning the initial peer organization on this blockchain network
- `name` organization name of the peer org
- `domain` domain name of the peer organization
- `enableNodeOUs` whether to define memberships explicitly (3 member types: `admin`, `orderer`, `client` instead of the original 2: `admin` and `member`)
- `peerCount` number of peers in this peer organization
- `userCount` number of user identities in this peer organization
- `ports` port settings of each peer in this peer organization
  - `port` opened port of the peer
  - `isPublishPort` whether to publish the opened port from the Docker container
  - `operationPort` port used to check the heartbeat of the instance
  - `isPublishOperationPort` whether to publish the health-check port from the Docker container

```json
{
  "ordererOrgs": [
    {
      "name": "Org0Orderer",
      "domain": "orderer.org0.example.com",
      "enableNodeOUs": true,
      "hostname": [
        "orderer0",
        "orderer1"
      ],
      "ports": [
        {
          "port": 7050,
          "isPublishPort": true,
          "operationPort": 8443,
          "isPublishOperationPort": true
        },
        {
          "port": 7150,
          "isPublishPort": true,
          "operationPort": 8543,
          "isPublishOperationPort": true
        }
      ]
    }
  ],
  "peerOrgs": [
    {
      "name": "Org0",
      "domain": "org0.example.com",
      "enableNodeOUs": true,
      "peerCount": 2,
      "userCount": 1,
      "ports": [
        {
          "port": 7051,
          "isPublishPort": true,
          "operationPort": 9443,
          "isPublishOperationPort": true
        },
        {
          "port": 7051,
          "isPublishPort": false,
          "operationPort": 9443,
          "isPublishOperationPort": false
        }
      ]
    },
    {
      "name": "Org1",
      "domain": "org1.example.com",
      "enableNodeOUs": true,
      "peerCount": 2,
      "userCount": 1,
      "ports": [
        {
          "port": 7051,
          "isPublishPort": true,
          "operationPort": 9443,
          "isPublishOperationPort": true
        },
        {
          "port": 7051,
          "isPublishPort": false,
          "operationPort": 9443,
          "isPublishOperationPort": false
        }
      ]
    }
  ]
}
```

### Step 1: Generate the required files of the blockchain network

Creates directory *BDK_NETWORK_NAME* under *~/.bdk*. Generates *crypto-config.yaml* to let `cryptogen` command generate certificates and keys for orderers and peers. Copies their tls-ca certificates to the *tlsca* directory under the folder mentioned prior, and generates *configtx.yaml* using `configtxgen`, which is used to generate *genesis.block*. Peer and orderer compose files are then generated.

```bash
bdk network create -f ~/.bdk/network-create.json --create-full
```

### Step 2: Start orderer and peer instances

Starts orderers or peers in organizations

```bash
# Start orderer instances
bdk orderer up -n orderer0.example.com -n orderer1.example.com

# Start peer instances
bdk peer up -n peer0.org1.example.com -n peer1.org1.example.com -n peer0.org2.example.com
```

### Step 3: Create a channel

Modifies variables *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* included in file *~/.bdk/.env*. Creates an [application channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel) with the name *test*. In order to allow new peer organizations to join the network with only one approval (this is not recommended in production environments), we modify the application channel's channel admin policy to allow approval after signature from one member. This is done by setting `--channelAdminPolicyStyle` to `Any-Member-in-Channel`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Create a new channel with peer0 in Org1
bdk channel create -n test --orderer orderer0.example.com:7050 -o Or1 -o Org2 --channelAdminPolicyStyle "Any-Member-in-Channel"
```

### Step 4: Add Org1 and Org2 into the channel

Adds Org1 and Org2 into the application channel named *test* . Note that each peer has to individually join the channel, so modifications to variables  *BDK_ORG_NAME, BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* in *~/.bdk/.env* are needed

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Add peer0 in Org1 into the channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Add peer1 in Org1 into the channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Add peer0 in Org2 into the channel
bdk channel join -n test --orderer orderer0.example.com:7050
```

### Step 5：Update anchor peers on the channel

Updates the settings of Org1 和 Org2 on the application channel named *test* 的 Application Channel. Pleas note that modifications to *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* in *~/.bdk/.env* are needed

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Update anchor peer on Org1
bdk channel update-anchorpeer -n test --orderer orderer1.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Update anchor peer on Org2
bdk channel update-anchorpeer -n test --orderer orderer0.example.com:7050
```

## Deploy Chaincode

### Step 1: Package the chaincode

Packages the chaincode source code along with the required modules into a *.tar* package called *fabcar* with version 1.

```bash
bdk chaincode package -n fabcar -v 1 -p ./chaincode/fabcar/go
```

### Step 2: Approve the chaincode from Org1 and Org2

 Installs and approves the chaincode labelled fabcar_1. Parameter `-a` is passed to restrict lifecycle chaincode deployment to run up to the step of `peer chaincode lifecycle approveformyorg`, parameter `-I` is used to specify that the chaincode requires initialization before it can be used.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Install and approve chaincode on peer0 in Org1
bdk chaincode install -l fabcar_1
bdk chaincode approve -C test -l fabcar_1 -I --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Install and approve chaincode on peer0 in Org2
bdk chaincode install -l fabcar_1
bdk chaincode approve -C test -l fabcar_1 -I --orderer orderer0.example.com:7050
```

### Step 3: Install chaincode on peer1 in Org1

Installs chaincode on peer1 in Org1

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Install chaincode on peer1 in Org1
bdk chaincode install -l fabcar_1
```

### Step 4: Deploy chaincode from Org1

Deploys the chaincode labelled *fabcar_1*. Parameter `-c` is passed to restrict lifecycle chaincode deployment to run up to the step of  `peer chaincode lifecycle commit`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk chaincode commit -C test -l fabcar_1 -I --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151
```

### Step 5: Initial chaincode from Org1

Run `bdk chaincode invoke` to initialize the chaincode labelled *fabcar_1*. Parameter `-f` is passed to select the function used in chaincode initialization.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk chaincode invoke -C test -n fabcar_1 -I -f InitLedger --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151
```

### Step 6: Invoke and query transactions from Org1 and Org2

Use `bdk chaincode invoke` to invoke transactions on the chaincode labelled *fabcar_1*. Parameter `-f` is passed to select the function used in chaincode invocation, parameter `-a` is used to specify the variables required by the chaincode function. Queries can be conducted by using `bdk chaincode query`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Invoke a transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG1_PEER0 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# Query data
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG1_PEER0

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Invoke a transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG1_PEER1 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer1.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# Query data
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG1_PEER1

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Invoke a transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG2_PEER0 -a BMW -a X6 -a blue -a Org2 --orderer orderer1.example.com:7150 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# Query data
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG2_PEER0
```

## Add New Channel

### Step 1：Create channel

First, we edit the organization name *BDK_ORG_NAME* and domain name *BDK_ORG_DOMAIN* set in the file *~/.bdk/.env*. We then create an [application channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel) named *test*, note that we set the flag `--channelAdminPolicyStyle` as `All-Initial-Member`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Create new channel for peer0 in Org1
bdk channel create -n test --orderer orderer0.example.com:7050 -o Or1 -o Org2
```

### Step 2：Add Org1 and Org2 to channel

Add Org1 and Org2 to the application channel named *test*. Since the application channel is joined with each peer individually, we need to edit the variables *BDK_ORG_NAME*, *BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* set in *~/.bdk/.env* every time.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Add peer0 of Org1 to channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Add peer1 of Org1 to channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Add peer0 of Org2 to channel
bdk channel join -n test --orderer orderer0.example.com:7050
```

### Step 3：Update anchor peer settings on channel for Org1 and Org2

Update settings for Org1 and Org2 on the application channel named *test*. Note that when updating the settings in *~/.bdk/.env*, *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* have to be editted as well.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Update anchor peer for Org1
bdk channel update-anchorpeer -n test --orderer orderer1.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Update anchor peer for Org2
bdk channel update-anchorpeer -n test --orderer orderer0.example.com:7050
```

## Add new peer org

First, we need to prepare a file named *org-peer-create.json*, with the required variables. We then use `cryptogen` to generate the certificates and keys required for the peer organization. Next, we add the Org3(the new peer org) to the settings file for the application channel. Last, we start the peers in Org3 and add it to the `test` channel. Test transactions and queries should be successful at this point.

### Prepare settings files

 *org-peer-create.json* contains parameters required for generating *configtx.yaml*, *crypto-config.yaml*, and *docker-compose.yaml*. Place the file in the current working directory.

`**name**` organization name for the peer organization

`**domain**` domain name for the peer organization

`**enableNodeOUs**` whether or not to declare different identities in the organization, available identities are `admin` and `member` with `members` having subcategories of `peer` and `client`.

`**peerCount**` number of peers in the peer organization

`**userCount**` number of users in the peer organization

`**ports**` individual port settings for each peer in the peer organization

|— `**port**` main peer port

|— `**isPublishPort**` whether or not to publish the port outside of the docker overlay network

|— `**operationPort**` port used for health checks

|__ `**isPublishOperationPort**` whether or not to publish the health check port outside of the docker overlay network

```json
[
    {
      "name": "Orgnew",
      "domain": "orgnew.example.com",
      "enableNodeOUs": true,
      "peerCount": 3,
      "userCount": 1,
      "ports": [
        {
          "port": 7351,
          "isPublishPort": true,
          "operationPort": 9743,
          "isPublishOperationPort": true
        },
        {
          "port": 7351,
          "isPublishPort": false,
          "operationPort": 9743,
          "isPublishOperationPort": false
        },
        {
          "port": 7351,
          "isPublishPort": false,
          "operationPort": 9743,
          "isPublishOperationPort": false
        }
      ]
    }
  ]
```

### Step 1：Create a peer organization named Org3

Create *crypto-config.yaml* for `cryptogen` to generate the certificates and keys required by the peer organization. We then copy the TLS CA certificates to the *tlsca* directory under the blockchain network and use *configtx.yaml* with `configtxgen` to generate the json settings file for the peer organization. Last, we generate the connection profile for the peer organization and *docker-compose.yaml* for it.

```bash
bdk org peer create -f ./org-peer-create.json --create-full
```

### Step 2：Add Org1 and Org3 to channel

Add Org3 to application channel with Org1

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk org peer add -o orderer0.org1.example.com:7050 -c test -n Orgnew
```

### Step 3：Start Org3 containers

Start Org3 peer containers

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

bdk peer up -n peer0.org3.example.com -n peer1.org3.example.com
```

### Step 4: Add Org3 to system-channel
Add Org3 to system channel with Org1Orderer

```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org1Orderer'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='orderer0'

bdk org peer add-system-channel -o orderer0.org1.example.com:7050 -n Orgnew
bdk channel approve -c system-channel
```

Approve system-channel change with Org1Orderer
```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org2Orderer'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='orderer0'

bdk org peer add-system-channel -o orderer0.org1.example.com:7050 -n Orgnew
bdk channel approve -c system-channel
```

update system-channel with Org1Orderer

```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org1Orderer'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='orderer0'

bdk channel update -o orderer0.org1.example.com:7050 -c system-channel
```

### Step 5：Add Org3 to channel

Add Org3 to the application channel named *test*. Since each peer is added individually to the application channel, changes to variables *BDK_ORG_NAME*, *BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* in *~/.bdk/.env* are required every time.

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

bdk channel join -n test --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer1'

bdk channel join -n test --orderer orderer0.example.com:7050
```

### Step 6：Deploy chaincode on Org3

Install and approve the chaincode named fabcar_1. Since we are using the blockchain network from before, we only need to do `peer chaincode lifecycle approveformyorg` up to this step. We can use the `-a` parameter to restrict the deployment of the chaincode lifecycle, and require the chaincode to be initialized with parameter ``-I`. We then install the chaincode named fabcar_1 on peer1 of Org3.

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Install and approve chaincode on peer0 of Org3
bdk chaincode install -l fabcar_1
bdk chaincode approve -C test -l fabcar_1 -I --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Install chaincode on peer1 of Org3
bdk chaincode install -l fabcar_1
```

### Step 7：Initiate and query a transaction on Org3

Initiate a chaincode transaction on fabcar_1 with `bdk chaincode invoke`. We use the `-f` parameter to select the function used to initialize the chaincode, and `-a` parameter to pass in the variables for the chaincode function. We can then query the chaincode with `bdk chaincode query`.

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Initiate transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG3_PEER0 -a BMW -a X6 -a blue -a Org3 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151 --peer-addresses peer0.org3.example.com:7251

# Query chaincode information
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG3_PEER0

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer1'

# Initiate transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG3_PEER1 -a BMW -a X6 -a blue -a Org3 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151 --peer-addresses peer1.org3.example.com:7251

# Query chaincode information
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG3_PEER1
```

## Add New Orderer Org

### Step 1 Create new orderer org

```bash
bdk org orderer create --interactive
```

### Step 2：Add orderer org to system channel

```bash
# export BDK_ORG_NAME='OrdererOrg'
# export BDK_ORG_DOMAIN='example.com'
# export BDK_HOSTNAME='orderer0'

bdk org orderer add system --interactive
```

### Step 3：Add orderer org to channel

```bash
# export BDK_ORG_NAME='OrdererOrg'
# export BDK_ORG_DOMAIN='example.com'
# export BDK_HOSTNAME='orderer0'

bdk org orderer add app --interactive
```
