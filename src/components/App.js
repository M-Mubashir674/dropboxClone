import DStorage from '../abis/DStorage.json'
import React, { Component } from 'react';
import Navbar from './Navbar'
import Main from './Main'
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({host:'ipfs.infura.io',port:5001,protocol:'https'})

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    //Setting up Web3
  }

  async loadBlockchainData() {

    const Web3 = require('web3');
    // web3 lib instance
    const web3 = new Web3(window.ethereum);
    // get all accounts
    const accounts = await web3.eth.getAccounts();


    //Declare Web3
    
    //Load account
    this.setState({account:accounts[0]})
    //Network ID
    const networkId = await web3.eth.net.getId();
    const networkData = DStorage.networks[networkId];
    if(networkData){
      const dstorage = new web3.eth.Contract(DStorage.abi,networkData.address)
      this.setState({dstorage})
      const filesCount = await dstorage.methods.fileCount().call()
      this.setState({filesCount})
      for(var i=filesCount;i >= 1;i--){
        const file = await dstorage.methods.files(i).call()
        this.setState({
          files:[...this.state.files,file]
        })
      }
    }else{
      window.alert("Dstorage contract not deployed")
    }
    this.setState({loading:false})
  }

  // Get file from user
  captureFile = event => {
    event.preventDefault()

    const file = event.target.files[0]
    const reader = new window.FileReader()

    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
        type: file.type,
        name: file.name
      })
      console.log('buffer', this.state.buffer)
    }
  }


  //Upload File
  uploadFile = description => {
    console.log("Submitting file to IPFS...")

    // Add file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result.size)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      // Assign value for the file without extension
      if(this.state.type === ''){
        this.setState({type: 'none'})
      }
      this.state.dstorage.methods.uploadFile(result[0].hash, result[0].size, this.state.type, this.state.name, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({
         loading: false,
         type: null,
         name: null
       })
       window.location.reload()
      }).on('error', (e) =>{
        window.alert('Error')
        this.setState({loading: false})
      })
    })
    //Add file to the IPFS

      //Check If error
        //Return error

      //Set state to loading

      //Assign value for the file without extension

      //Call smart contract uploadFile function 

  }

  //Set states
  constructor(props) {
    super(props)
    this.state = {
      account:'',
      dstrorage:null,
      files:[],
      loading:false,
      type:null,
      name:null
    }

    //Bind functions
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              files={this.state.files}
              captureFile={this.captureFile}
              uploadFile={this.uploadFile}
            />
        }
      </div>
    );
  }
}

export default App;