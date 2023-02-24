<script setup lang="ts">
import { onMounted } from "@vue/runtime-core";
import { useUser } from "@/stores/user";
import { ref } from "vue";
import router from "@/router";
const myBalance = useUser;

let money = ref("");
let transferAccount = ref("");
let transferMoney = ref("");

onMounted(() => {
  myBalance.dispatch("getBalance");

  if (myBalance.state.isAuthen == false) {
    router.push('/login');
  }
});

function deposit(){
  myBalance.state.money = money.value;
  myBalance.dispatch("deposit");
  router.push('/transaction');
}

function withdraw(){
  myBalance.state.money = money.value;
  myBalance.dispatch("withdraw");
  router.push('/transaction');

}

function transfer(){
  myBalance.state.transferAccount = transferAccount.value
  myBalance.state.money = transferMoney.value
  myBalance.dispatch("transfer");
  router.push('/transaction');


}
</script>

<template>
  <div class="container d-flex justify-content-center">
    <div class="balance status">
      <h5>Balance</h5>
      <h2>
        $ <span id="current-balance">{{ myBalance.state.balance }}</span>
      </h2>
    </div>
  </div>
  <div class="container d-flex justify-content-center">
    <div class="col-lg-6">
      <div class="submit-area">
        <h4>Deposit/Withdraw Amount</h4>
        <input
          id="deposit-amount"
          type="number"
          class="form-control"
          placeholder="Enter deposit/withdraw amount"
          v-model="money"
        /><br />
        <button id="deposit-btn" class="btn btn-success" @click="deposit">Deposit</button>
        <button id="deposit-btn" class="btn btn-success" @click="withdraw">Withdraw</button>
      </div>
    </div>
  </div>
  <div class="container d-flex justify-content-center">
    <div class="col-lg-6">
      <div class="submit-area">
        <h4>Transfer Money</h4>
        <input
          id="deposit-amount"
          type="text"
          class="form-control"
          placeholder="Enter account number to transfer"
          v-model="transferAccount"
        /><br />
        <input
          id="deposit-amount"
          type="number"
          class="form-control"
          placeholder="Enter money amount"
          v-model="transferMoney"
        /><br />
        <button id="deposit-btn" class="btn btn-success" @click="transfer">Transfer</button>
      </div>
    </div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

.container{
  margin-bottom: 20px;
}
</style>
