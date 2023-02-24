<script setup lang="ts">
import { ref } from "@vue/reactivity";
import { onMounted } from "@vue/runtime-core";
import { useUser } from "@/stores/user";
import router from "@/router";
const myBalance = useUser;

onMounted(() => {
  myBalance.dispatch('getAllData');
  if (!myBalance.state.isAuthen) {
    router.push("/login");
  }
});

function getReceiveHistory(){
  myBalance.dispatch('getReceiveHistory');
}

function getTransferHistory(){
  myBalance.dispatch('getTransferHistory');
}
</script>

<template>
  <section>
    <div class="container">
      <div class="col-lg-12 mb-12 d-flex justify-content-center">
        <div class="balance status">
          <h5>Balance</h5>
          <h2>$ <span id="current-balance">{{ myBalance.state.balance}}</span></h2>
        </div>
      </div>
      <h2 class="center">Transaction history</h2>

      <button type="button" class="btn btn-primary" @click="getTransferHistory">
        Transfer Menu
      </button>
      <button type="button" class="btn btn-primary" @click="getReceiveHistory">Receive Menu</button>
      <table class="table">
        <thead>
          <tr>
            <th scope="col">No</th>
            <th scope="col">Datetime</th>
            <th scope="col">User</th>
            <th scope="col">Remain</th>
            <th scope="col">Action</th>
            <th scope="col">To</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in myBalance.state.transaction">
            <th scope="row">{{ index +1 }}</th>
            <td>{{ item.datetime }}</td>
            <td>{{ item.from_fullname }}</td>
            <td>{{ item.remain }}</td>
            <td>{{ item.action_name }}</td>
            <td>{{ item.to_fullname }}</td>
            <td>{{ item.amount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style>
.circle {
  height: 300px;
  width: 300px;
  margin: 0 auto;
  border: solid cornflowerblue 3px;
  border-radius: 100%;
}
.btn {
  margin: 1rem;
}

.submit-area {
	padding: 30px;
	margin-top: 50px;
	border-radius: 10px;
	box-shadow: 5px 5px gray;
  color: white;
  background-color: royalblue;
}

#account-area {
	margin-top: 5%;
}

.deposit {
	background-color: slateblue;
}

.withdraw {
	background-color: lightsalmon;
}

.balance {
	background-color: tomato;
}

.status {
	margin: 0 30px;
	color: white;
	padding: 20px;
	border-radius: 10px;
  width: 500px;
}

</style>
