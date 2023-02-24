import { defineStore } from "pinia";
import axios from "axios";
import qs from "qs";
import router from "@/router";
import Swal from "sweetalert2";
import Vuex from 'vuex';


export const useUser =  new Vuex.Store({
  state: {
    username: "",
    password: "",
    isAuthen: false,
    access_token: "",
    balance: "",
    money: "",
    transaction: [],
    transferAccount: "",
  },
  mutations: {
    updateUsername(state, payload) {
      state.username = payload
    },
    updatePassword(state, payload) {
      state.password = payload
    },
    updateIsAuthen(state, payload) {
      state.isAuthen = payload
    },
    updateAccessToken(state, payload) {
      state.access_token = payload
    },
    updateBalance(state, payload) {
      state.balance = payload
    },
    updateMoney(state, payload) {
      state.money = payload
    },
    updatetransaction(state, payload) {
      state.transaction = payload
    },
  },
  actions: {
    async getAllData(){
      try{
      let storageToken = localStorage.getItem("access_token") || "";
      this.state.access_token = storageToken;
      this.state.isAuthen = true;
      await this.dispatch('getBalance');
      await this.dispatch('getTransferHistory');
    } catch (e) {
      Swal.fire("Someting went wrong", "Please try again later", "error");
    }
    },
    async deposit() {
      try {
        if (this.state.access_token == "") {
          let storeageToken = localStorage.getItem("access_token") || "";
          this.state.access_token = storeageToken;
        }
        if (this.state.access_token == "") return;
        const deposit = await axios.post("http://localhost:3000/api/bank/deposit",
        JSON.stringify({
          money: this.state.money,
        }),
         {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.state.access_token,
          },
        }
        );
        if (deposit.status == 200) {
          Swal.fire("Deposit Success", "deposit $" + this.state.money +" successfully ", "success");
          this.dispatch('getBalance');
        }


      } catch (e) {
        this.state.isAuthen =  false;
        Swal.fire("Deposit failed", "", "error");
      }
    },
    async transfer() {
      try {
        if (this.state.access_token == "") {
          let storeageToken = localStorage.getItem("access_token") || "";
          this.state.access_token = storeageToken;
        }
        if (this.state.access_token == "") return;
        const transferMoney = await axios.post("http://localhost:3000/api/bank/transfer",
          JSON.stringify({
            money: this.state.money,
            transfer_account: this.state.transferAccount,
          }),
         {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.state.access_token,
          },
        },
        );
        if (transferMoney.status == 200) {
          Swal.fire("Transfer Success", "transfer $" + this.state.money +" successfully ", "success");
          this.dispatch('getBalance');
        }

      } catch (e) {
        Swal.fire("Transfer history failed", "Cannot get Transfer history now please try again.", "error");
      }
    },

    async getTransferHistory() {
      try {
        if (this.state.access_token == "") {
          let storeageToken = localStorage.getItem("access_token") || "";
          this.state.access_token = storeageToken;
        }
        if (this.state.access_token == "") return;
        const transferHistory = await axios.get("http://localhost:3000/api/bank/transfer-history",
         {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.state.access_token,
          },
        }
        );
        if (transferHistory.status == 200) {
          this.state.transaction = transferHistory.data.transaction[0].transfer;
        }

      } catch (e) {
        Swal.fire("Transfer history failed", "Cannot get Transfer history now please try again.", "error");
      }
    },
    
    async getReceiveHistory() {
      try {
        if (this.state.access_token == "") {
          let storeageToken = localStorage.getItem("access_token") || "";
          this.state.access_token = storeageToken;
        }
        if (this.state.access_token == "") return;
        const receiveHistory = await axios.get("http://localhost:3000/api/bank/receive-history",
         {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.state.access_token,
          },
        }
        );
        if (receiveHistory.status == 200) {
          this.state.transaction = receiveHistory.data.transaction[0].receive;
        }

      } catch (e) {
        Swal.fire("Transfer history failed", "Cannot get Transfer history now please try again.", "error");
      }
    },


    async withdraw() {
      try {
        console.log(this.state.money);
        if (this.state.access_token == "") {
          let storeageToken = localStorage.getItem("access_token") || "";
          this.state.access_token = storeageToken;
        }
        if (this.state.access_token == "") return;
        const withdraw = await axios.post("http://localhost:3000/api/bank/withdraw",
          JSON.stringify({
            money: this.state.money,
          }),
         {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.state.access_token,
          },
        },
        );
        if (withdraw.status == 200) {
          Swal.fire("Withdraw Success", "Withdraw $" + this.state.money +" successfully ", "success");
          this.dispatch('getBalance');
        }

      } catch (e) {
        Swal.fire("Cannot withdraw", "Balance in your account is not enough", "error");
      }
    },

    async getBalance() {
      try {
        if (this.state.access_token == "") {
          let storageToken = localStorage.getItem("access_token") || "";
          this.state.access_token = storageToken
        }
        if (this.state.access_token == "") return;
        let userData = await axios.get("http://localhost:3000/api/bank/balance", {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.state.access_token,
          },
        });
        this.state.balance = userData.data.balance.balance;
      } catch (e) {
        this.state.isAuthen = false;
        Swal.fire("Failed", "Failed try again later.", "error");
      }
    },
    async login() {
      try {

        let userLogin = await axios.post(
          "http://localhost:3000/api/auth/login",
          JSON.stringify({
            username: this.state.username,
            password: this.state.password,
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (userLogin.status == 200) {
          localStorage.setItem("access_token", userLogin.data);
          this.state.isAuthen = true;
          this.state.access_token = userLogin.data;

          await this.dispatch('getBalance');
          await this.dispatch('getTransactionHistory');
          Swal.fire("Login Success", "", "success");
          router.push("/home");
        }
      } catch (e: any) {
        Swal.fire("Login Fail", "Authenticator Failed", "error");
      }
    },  
}
})