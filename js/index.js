import * as data from './data.json';

const { createApp } = Vue;
const application = createApp({
  data() {
    return {
      links: [],
    }
    },
    mounted() {
      this.links = data;
      console.log("hola");
    }
});

application.mount('#app')
