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

Creates directory *BDK_FABRIC_NETWORK_NAME* under *~/.bdk/fabric*. Generates *crypto-config.yaml* to let `cryptogen` command generate certificates and keys for orderers and peers. Copies their tls-ca certificates to the *tlsca* directory under the folder mentioned prior, and generates *configtx.yaml* using `configtxgen`, which is used to generate *genesis.block*. Peer and orderer compose files are then generated.

```bash
bdk fabric network create -f create.json --create-full
```

### Step 2: Start orderer and peer instances

Starts orderers or peers in organizations

```bash
# Start orderer instances
bdk fabric orderer up -i
```
choose orderer0.orderer.org0.example.com, orderer1.orderer.org0.example.com
```bash
# Start peer instances
bdk fabric peer up -i
```
choose peer0.org0.example.com, peer0.org1.example.com, peer1.org0.example.com, peer1.org1.example.com

### Step 3: Create a channel

Modifies variables *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* included in file *~/.bdk/.env*. Creates an [application channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel) with the name *test*. In order to allow new peer organizations to join the network with only one approval (this is not recommended in production environments), we modify the application channel's channel admin policy to allow approval after signature from one member. This is done by setting `--channelAdminPolicyStyle` to `Any-Member-in-Channel`.

```bash
# Create a new channel with peer0 in Org0
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel create -i
```
choose 
- test
- orderer0.orderer.org0.example.com:7050
- Org0, Org1
- ImplicitMeta
- Any Admins signature in channel

### Step 4: Add Org0 and Org1 into the channel

Adds Org0 and Org1 into the application channel named *test* . Note that each peer has to individually join the channel, so modifications to variables  *BDK_ORG_NAME, BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* in *~/.bdk/.env* are needed

```bash
# Add peer0 in Org0 into the channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050
```bash
# Add peer1 in Org0 into the channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050
```bash
# Add peer1 in Org1 into the channel
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050

### Step 5：Update anchor peers on the channel

Updates the settings of Org0 和 Org1 on the application channel named *test* 的 Application Channel. Pleas note that modifications to *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* in *~/.bdk/.env* are needed

```bash
# Update anchor peer0 on Org0
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel update-anchorpeer -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050
- 7051
```bash
# Update anchor peer1 on Org1
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel update-anchorpeer -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050
- 7051

## Deploy Chaincode

### Step 1: Package the chaincode

Packages the chaincode source code along with the required modules into a *.tar* package called *fabcar* with version 1.

```bash
bdk fabric chaincode package -i
```
choose
- fabcar
- 1
- ./chaincode/fabcar/go

### Step 2: Approve the chaincode from Org0 and Org1

 Installs and approves the chaincode labelled fabcar_1. Parameter `-a` is passed to restrict lifecycle chaincode deployment to run up to the step of `peer chaincode lifecycle approveformyorg`, parameter `-I` is used to specify that the chaincode requires initialization before it can be used.

```bash
# Install and approve chaincode on peer0 in Org0
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode install -i
```
choose
- fabcar
- 1
```bash
bdk fabric chaincode approve -i
```
choose 
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050
```bash
# Install and approve chaincode on peer1 in Org1
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode install -i
```
choose
- fabcar
- 1
```bash
bdk fabric chaincode approve -i
```
choose
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050

### Step 3: Install chaincode on peer1 in Org0

Installs chaincode on peer1 in Org0

```bash
# Install chaincode on peer1 in Org0
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode install -i
```
choose
- fabcar
- 1

### Step 4: Deploy chaincode from Org0

Deploys the chaincode labelled *fabcar_1*. Parameter `-c` is passed to restrict lifecycle chaincode deployment to run up to the step of  `peer chaincode lifecycle commit`.

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode commit -i
```
choose
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051

### Step 5: Initial chaincode from Org0

Run `bdk fabric chaincode invoke` to initialize the chaincode labelled *fabcar_1*. Parameter `-f` is passed to select the function used in chaincode initialization.

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- InitLedger
- (skip) 
- true
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051

### Step 6: Invoke and query transactions from Org0 and Org1

Use `bdk fabric chaincode invoke` to invoke transactions on the chaincode labelled *fabcar_1*. Parameter `-f` is passed to select the function used in chaincode invocation, parameter `-a` is used to specify the variables required by the chaincode function. Queries can be conducted by using `bdk fabric chaincode query`.

```bash
# Invoke a transaction
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER0,BMW,X6,blue,Org0
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash
# Query data
bdk fabric chaincode query -i
```
choose
- test
- fabcar
- QueryCar
- CAR_ORG1_PEER0
```bash
# Invoke a transaction
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER1,BMW,X6,blue,Org0
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash
# Query data
bdk fabric chaincode query -i
```
choose
- test
- fabcar
- QueryCar
- CAR_ORG1_PEER1
```bash
# Invoke a transaction
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER2,BMW,X6,blue,Org1
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash
# Query data
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER2,BMW,X6,blue,Org1
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash

## Add New Channel

### Step 1：Create channel

First, we edit the organization name *BDK_ORG_NAME* and domain name *BDK_ORG_DOMAIN* set in the file *~/.bdk/.env*. We then create an [application channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel) named *test1*, note that we set the flag `--channelAdminPolicyStyle` as `All-Initial-Member`.

```bash
# Create new channel for peer0 in Org0
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel create -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050
- Org0, Org1
- Signature
- All admin signature of initial member

### Step 2：Add Org0 and Org1 to channel

Add Org0 and Org1 to the application channel named *test*. Since the application channel is joined with each peer individually, we need to edit the variables *BDK_ORG_NAME*, *BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* set in *~/.bdk/.env* every time.

```bash
# Add peer0 of Org0 to channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050
```bash
# Add peer1 of Org0 to channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050
```bash
# Add peer1 of Org1 to channel
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050

### Step 3：Update anchor peer settings on channel for Org0 and Org1

Update settings for Org0 and Org1 on the application channel named *test1*. Note that when updating the settings in *~/.bdk/.env*, *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* have to be editted as well.

```bash
# Update anchor peer0 for Org0
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel update-anchorpeer -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050
- 7051
```bash
# Update anchor peer1 for Org1
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel update-anchorpeer -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050
- 7051

## Add new peer org

First, we need to prepare a file named *org-peer-create.json*, with the required variables. We then use `cryptogen` to generate the certificates and keys required for the peer organization. Next, we add the Orgnew(the new peer org) to the settings file for the application channel. Last, we start the peers in Orgnew and add it to the `test1` channel. Test transactions and queries should be successful at this point.

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

### Step 1：Create a peer organization named Orgnew 

Create *crypto-config.yaml* for `cryptogen` to generate the certificates and keys required by the peer organization. We then copy the TLS CA certificates to the *tlsca* directory under the blockchain network and use *configtx.yaml* with `configtxgen` to generate the json settings file for the peer organization. Last, we generate the connection profile for the peer organization and *docker-compose.yaml* for it.

```bash
bdk fabric org peer create -f ./org-peer-create.json --create-full
```

### Step 2：Add Org0 and Orgnew to channel

Add Orgnew to application channel with Org0

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric org peer add -i
```
choose
- test1
- Orgnew

### Step 3：Start Orgnew containers

Start Orgnew peer containers

```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric peer up -i
```
choose peer0.org0.example.com, peer0.org1.example.com, peer0.orgnew.example.com, peer1.org0.example.com, peer1.org1.example.com, peer1.orgnew.example.com, peer2.orgnew.example.com

### Step 4: Add Orgnew to system-channel
Add Orgnew to system channel with Org0Orderer

```bash
export BDK_ORG_TYPE='orderer'
export BDK_ORG_NAME='Org0Orderer'
export BDK_ORG_DOMAIN='orderer.org0.example.com'
export BDK_HOSTNAME='orderer0'

bdk fabric org peer add-system-channel -i
```
choose
- Orgnew
- orderer0.orderer.org0.example.com:7050
```bash
bdk fabric channel approve -i
```
choose system-channel

(skip no Org2Orderer) Approve system-channel change with Org2Orderer
```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org2Orderer'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='orderer0'

# choose Orgnew; orderer0.orderer.org0.example.com:7050
bdk fabric org peer add-system-channel -i
# choose system-channel
bdk fabric channel approve -i
```

(skip no Org2Orderer) update system-channel with Org1Orderer

```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org1Orderer'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='orderer0'

# choose system-channel; orderer0.orderer.org0.example.com:7050
bdk fabric channel update -i
```

### Step 5：Add Orgnew to channel

Add Orgnew to the application channel named *test1*. Since each peer is added individually to the application channel, changes to variables *BDK_ORG_NAME*, *BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* in *~/.bdk/.env* are required every time.

```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
choose
- test1
- orderer0.orderer.org0.example.com:7050

### Step 6：Deploy chaincode on Orgnew

Install and approve the chaincode named fabcar_1. Since we are using the blockchain network from before, we only need to do `peer chaincode lifecycle approveformyorg` up to this step. We can use the `-a` parameter to restrict the deployment of the chaincode lifecycle, and require the chaincode to be initialized with parameter ``-I`. We then install the chaincode named fabcar_1 on peer1 of Orgnew.

```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

# Install and approve chaincode on peer0 of Orgnew
bdk fabric chaincode install -i
```
choose
- fabcar
- 1
```bash
bdk fabric chaincode approve -i
```
choose
- test1
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

# Install chaincode on peer1 of Orgnew
bdk fabric chaincode install -i
```
choose
- fabcar
- 1

### Step 7：Initiate and query a transaction on Orgnew

Initiate a chaincode transaction on fabcar_1 with `bdk fabric chaincode invoke`. We use the `-f` parameter to select the function used to initialize the chaincode, and `-a` parameter to pass in the variables for the chaincode function. We can then query the chaincode with `bdk fabric chaincode query`.

```bash
# Initiate transaction
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
choose
- test1
- fabcar
- CreateCar
- CAR_ORG3_PEER0, BMW, X6, blue, Org3
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- all
```bash

# Query chaincode information
bdk fabric chaincode query -i
```
choose
- test1
- fabcar
- QueryCar
- CAR_ORG3_PEER0
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

# Initiate transaction
bdk fabric chaincode invoke -i
```
choose
- test1
- fabcar
- CreateCar
- CAR_ORG3_PEER1, BMW, X6, blue, Org3
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- all
```bash

# Query chaincode information
bdk fabric chaincode query -i
```
choose
- test1
- fabcar
- QueryCar
- CAR_ORG3_PEER1

## Add New Orderer Org

### Step 1 Create new orderer org

```bash
bdk fabric org orderer create --interactive
```
choose
- 1
- Org1Orderer
- org1orderer.example.com
- True
- orderer0
- 7050
- True
- 8443
- True
- new.genesis
- Yes, please generate them for me with cryptogen
- Yes, please generate orderer org config json file
- yes

### Step 2：Add orderer org to system channel

```bash
export BDK_ORG_TYPE='orderer'
export BDK_ORG_NAME='Org1Orderer'
export BDK_ORG_DOMAIN='org1orderer.example.com'
export BDK_HOSTNAME='orderer0'
# system-channel
bdk fabric org orderer add --interactive
```

### Step 3：Add orderer org to channel

```bash
export BDK_ORG_TYPE='orderer'
export BDK_ORG_NAME='Org1Orderer'
export BDK_ORG_DOMAIN='org1orderer.example.com'
export BDK_HOSTNAME='orderer0'
# application 
bdk fabric org orderer add --interactive
```
