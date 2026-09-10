const axios = require('axios');

const ALCHEMY_BASE = 'https://eth-mainnet.g.alchemy.com/v2';
const ALCHEMY_WS = 'wss://eth-mainnet.g.alchemy.com/v2';

class AlchemyService {
  constructor() {
    this.apiKey = process.env.ALCHEMY_API_KEY;
    this.baseURL = `${ALCHEMY_BASE}/${this.apiKey}`;
    this.wsURL = `${ALCHEMY_WS}/${this.apiKey}`;
  }

  async makeRequest(method, params = []) {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      });
      return response.data.result;
    } catch (error) {
      console.error(`Alchemy API error (${method}):`, error.message);
      throw error;
    }
  }

  async getLatestBlock() {
    const hexBlock = await this.makeRequest('eth_blockNumber');
    const blockNum = parseInt(hexBlock, 16);
    const block = await this.makeRequest('eth_getBlockByNumber', [hexBlock, true]);
    return {
      number: blockNum,
      hash: block.hash,
      timestamp: parseInt(block.timestamp, 16),
      transactions: block.transactions || [],
      gasUsed: parseInt(block.gasUsed, 16),
      gasLimit: parseInt(block.gasLimit, 16)
    };
  }

  async getBlockByNumber(blockNum) {
    const hex = '0x' + blockNum.toString(16);
    const block = await this.makeRequest('eth_getBlockByNumber', [hex, true]);
    if (!block) return null;
    return {
      number: blockNum,
      hash: block.hash,
      timestamp: parseInt(block.timestamp, 16),
      transactions: block.transactions || [],
      gasUsed: parseInt(block.gasUsed, 16),
      gasLimit: parseInt(block.gasLimit, 16)
    };
  }

  async getTransaction(txHash) {
    const tx = await this.makeRequest('eth_getTransactionByHash', [txHash]);
    if (!tx) return null;

    let receipt = null;
    try {
      receipt = await this.makeRequest('eth_getTransactionReceipt', [txHash]);
    } catch (e) {}

    const valueEth = parseInt(tx.value, 16) / 1e18;
    const gasPrice = tx.gasPrice ? parseInt(tx.gasPrice, 16) / 1e9 : 0;

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: valueEth,
      gasPrice: gasPrice,
      gasLimit: parseInt(tx.gas, 16),
      gasUsed: receipt ? parseInt(receipt.gasUsed, 16) : 0,
      blockNumber: parseInt(tx.blockNumber, 16),
      nonce: parseInt(tx.nonce, 16),
      status: receipt ? (parseInt(receipt.status, 16) === 1 ? 'success' : 'failed') : 'pending',
      timestamp: Date.now()
    };
  }

  async getWalletBalance(address) {
    const balance = await this.makeRequest('eth_getBalance', [address, 'latest']);
    return parseInt(balance, 16) / 1e18;
  }

  async getTransactionCount(address) {
    const count = await this.makeRequest('eth_getTransactionCount', [address, 'latest']);
    return parseInt(count, 16);
  }

  async getAssetTransfers(params) {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: params.fromBlock || '0x0',
          toBlock: params.toBlock || 'latest',
          fromAddress: params.fromAddress,
          toAddress: params.toAddress,
          category: params.category || ['external', 'erc20', 'erc721'],
          withMetadata: true,
          excludeZeroValue: params.excludeZeroValue !== false,
          maxCount: params.maxCount || '0x64'
        }]
      });
      return response.data.result?.transfers || [];
    } catch (error) {
      console.error('Asset transfers error:', error.message);
      return [];
    }
  }

  async getTokenBalances(address) {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address]
      });
      return response.data.result?.tokenBalances || [];
    } catch (error) {
      return [];
    }
  }

  async getTokenMetadata(contractAddress) {
    try {
      const response = await axios.post(this.baseURL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenMetadata',
        params: [contractAddress]
      });
      return response.data.result;
    } catch (error) {
      return null;
    }
  }

  getWebSocketURL() {
    return this.wsURL;
  }
}

module.exports = new AlchemyService();
