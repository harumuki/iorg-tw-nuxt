<template>
<main>
  <navbar />
  <nuxt />
  <Foooter />
</main>
</template>

<script>
import Navbar from '~/components/Navbar'
import Foooter from '~/components/Footer'

export default {
  components: {
    Navbar,
    Foooter
  }
}
</script>

<style lang="scss">
@import '~assets/styles/resources';
@import '~assets/styles/common';

:root {
  --iorg-primary-dark-color: #1E1E1E;
  --iorg-primary-light-color: #EEE;
  --iorg-text: #303030;
  --iorg-paper: #F5F5F5;
  --iorg-background: #D0D0D0;
  --iorg-neutral: #808080;
  --iorg-accent: #2CD086;
}
</style>
