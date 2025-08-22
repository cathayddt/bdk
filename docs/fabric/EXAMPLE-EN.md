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
# Before executing chaincode command, do go vendor to enable go packages
cd chaincode/fabcar/go
go mod vendor

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

## Joining a Channel Using Snapshot

### Step 1: Execute `submitSnapshot` on a peer already in the channel

```bash
# peer0 in Org0 is already in the channel (channel name: test)
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

choose
- Operation : submitRequest
- Channel Name : test
- Block Number : 0 (execute snapshot immediately) or N (execute snapshot after N blocks)

p.s. The completed snapshot will be copied to host under .bdk/fabric/{networkName}/peerOrganizations/{domain}/peers/peer{number}.{domain}/snapshots/completed/{channelName}/{blockHeight}

### Step 2 (Optional) : Check submitted snapshot requests

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

choose
- Operation : listPending
- Channel Name : test

This command lists all pending snapshot requests (requests with blockNumber=0 will not appear).

### Step 3 (Optional): Delete unnecessary snapshot requests

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```
choose
- Operation : cancelRequest
- Channel Name : test
- Block Number : N (the snapshot request for block N will be deleted)

After deletion, run listPending again to verify the request has been removed.

### Step 4: Use `joinBySnapshot` to add the new peer to the channel

```bash
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org1.example.com:8051

bdk fabric channel snapshot -i
```

choose
- Operation : joinBySnapshot
- Snapshot Path : $.bdk/fabric/bdk-fabric-network/peerOrganizations/org0.example.com/peers/peer0.org0.example.com/snapshots/completed/test/0/ (Example) (Enter the absolute path of the snapshot directory on host)

### Step 5: Verify whether the new peer has joined the channel successfully

```bash
# Inside peer0.org1.example.com's container, run `peer channel list or peer channel getinfo` to check if it has joined
peer channel list
peer channel getinfo -c {channelName}
```

## Add New Peer Org

First, we need to prepare a file named *org-peer-create.json*, with the required variables. We then use `cryptogen` to generate the certificates and keys required for the peer organization. Next, we add the Orgnew(the new peer org) to the application channel configuration file. We then start the peers in Orgnew and add them to the `test` channel. Finally, we test transactions and queries initiated by Orgnew.

### Important Process Overview

**The complete process for adding a new peer organization includes the following key steps:**

1. **Generate organization certificates and configuration files** - Using `bdk fabric org peer create` 
2. **Generate channel configuration update** - Using `bdk fabric org peer add-channel` 
3. **⚠️ Critical Step: Submit configuration update to orderer** - Using `peer channel update` command
4. **Start the new organization's peer containers**
5. **All peers individually join the channel** - Using `bdk fabric channel join`

**Important Notes:**
- Step 2 only generates the configuration update file, **Step 2.1 must be executed to submit it to the orderer for it to take effect**
- Without executing Step 2.1, the new organization's peers will encounter `FORBIDDEN` errors
- Configuration updates need to be submitted by an organization with administrative privileges (such as Org0)

### Prerequisites

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
      "peerCount": 2,
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

### Step 2：Add Orgnew to Channel Configuration

Add Orgnew to the Application Channel configuration with Org0 identity

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric org peer add -i
```
choose
- test
- Orgnew

**Important: This step only generates the configuration update file, the next step is required to submit it to the orderer for it to take effect**

### Step 2.1：Submit Configuration Update to Orderer

**Critical Step**: Submit the configuration update to the orderer to make it effective. Use BDK's `channel update` command to complete this step.

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel update -c test -o orderer0.orderer.org0.example.com:7050
```

**Or use interactive mode:**
```bash
bdk fabric channel update -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050

**Important Notes:**
- This step must be executed by an organization with administrative privileges (such as Org0)
- After successful execution, the new organization is truly added to the channel configuration
- Only after this step succeeds can the new organization's peers join the channel

### Step 3：Start Orgnew containers

Start Orgnew peer containers

```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric peer up -i
```
choose peer0.orgnew.example.com, peer1.orgnew.example.com

### Step 4: Add Orgnew to system-channel

Add Orgnew to System Channel with Org0Orderer identity and approve

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

### Step 5：All Orgnew peers join Channel

All Orgnew peers join the Application Channel named *test*. Since joining the Application Channel is done on a per-peer basis, each peer needs to join individually.

#### Peer0 joins the channel
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050

#### Peer1 joins the channel
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
choose
- test
- orderer0.orderer.org0.example.com:7050

#### Verify all peers have successfully joined the channel
You can use the following commands to verify that each peer has joined the channel:

```bash
# Check peer0
docker exec peer0.orgnew.example.com peer channel list

# Check peer1  
docker exec peer1.orgnew.example.com peer channel list
```

### Step 6：Deploy chaincode on Orgnew

Install and approve the chaincode labeled fabcar_1. Since we are using the blockchain network from before, we only need to do `peer chaincode lifecycle approveformyorg` up to this step. We use the `-a` parameter to restrict the deployment of the chaincode lifecycle to only `peer chaincode lifecycle approveformyorg`, and use `-I` to indicate that this chaincode needs to be initialized before use. We then install the chaincode named fabcar_1 on peer1 of Orgnew.

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
- test
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

### Step 7：Initiate and query transactions on Orgnew

Use `bdk fabric chaincode invoke` with the chaincode named fabcar_1 to initiate transactions. Use the `-f` parameter to select the function used to initialize the chaincode, and `-a` parameter to input the parameters required by the chaincode function. You can then use `bdk fabric chaincode query` to query information from the chaincode.

```bash
# Initiate transaction
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- CreateCar
- CAR_ORGNEW_PEER0, BMW, X6, blue, Orgnew
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- all
```bash
# Query information
bdk fabric chaincode query -i
```
choose
- test
- fabcar
- QueryCar
- CAR_ORGNEW_PEER0
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

# Initiate transaction
bdk fabric chaincode invoke -i
```
choose
- test
- fabcar
- CreateCar
- CAR_ORGNEW_PEER1, BMW, X6, blue, Orgnew
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- all
```bash
# Query information
bdk fabric chaincode query -i
```
choose
- test
- fabcar
- QueryCar
- CAR_ORGNEW_PEER1

### Common Issues and Troubleshooting

#### Issue 1: FORBIDDEN error when peer joins channel

**Symptom:**
```
Error: can't read the block: &{FORBIDDEN}
```

**Cause:** Configuration update was not submitted to the orderer, so the new organization has not actually been added to the channel configuration.

**Solution:** Ensure Step 2.1 configuration update submission has been executed.

#### Issue 2: Certificate path error

**Symptom:**
```
Cannot run peer because cannot init crypto, specified path does not exist
```

**Solution:** Check and use the correct paths inside the container:
- MSP path: `/tmp/peerOrganizations/orgnew.example.com/users/Admin@orgnew.example.com/msp`
- TLS CA certificate: Copy to the correct location inside the container

#### Issue 3: TLS certificate verification failure

**Symptom:**
```
tls: failed to verify certificate: x509: certificate signed by unknown authority
```

**Solution:** Use the correct orderer TLS CA certificate:
```bash
docker cp ~/.bdk/fabric/bdk-fabric-network/ordererOrganizations/orderer.org0.example.com/tlsca/tlsca.orderer.org0.example.com-cert.pem peer0.org0.example.com:/tmp/
```

#### Issue 4: Verify if configuration update is effective

**Verification method:**
```bash
# Check if channel configuration includes the new organization
peer channel fetch config -o orderer0.orderer.org0.example.com:7050 -c test --tls --cafile /path/to/orderer/ca.crt

# Use configtxlator to decode and view
configtxlator proto_decode --input config.pb --type common.Config --output config.json
```

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

## Joining a Channel Using Snapshot

### Step 1: Execute `submitSnapshot` on a peer already in the channel

```bash
# peer0 in Org0 is already in the channel (channel name: test)
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

choose
- Operation : submitRequest
- Channel Name : test
- Block Number : 0 (execute snapshot immediately) or N (execute snapshot after N blocks)

p.s. The completed snapshot will be copied to host under .bdk/fabric/{networkName}/peerOrganizations/{domain}/peers/peer{number}.{domain}/snapshots/completed/{channelName}/{blockHeight}

### Step 2 (Optional) : Check submitted snapshot requests

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

choose
- Operation : listPending
- Channel Name : test

This command lists all pending snapshot requests (requests with blockNumber=0 will not appear).

### Step 3 (Optional): Delete unnecessary snapshot requests

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```
choose
- Operation : cancelRequest
- Channel Name : test
- Block Number : N (the snapshot request for block N will be deleted)

After deletion, run listPending again to verify the request has been removed.

### Step 4: Use `joinBySnapshot` to add the new peer to the channel

```bash
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org1.example.com:8051

bdk fabric channel snapshot -i
```

choose
- Operation : joinBySnapshot
- Snapshot Path : $.bdk/fabric/bdk-fabric-network/peerOrganizations/org0.example.com/peers/peer0.org0.example.com/snapshots/completed/test/0/ (Example) (Enter the absolute path of the snapshot directory on host)

### Step 5: Verify whether the new peer has joined the channel successfully

```bash
# Inside peer0.org1.example.com's container, run `peer channel list or peer channel getinfo` to check if it has joined
peer channel list
peer channel getinfo -c {channelName}
```
