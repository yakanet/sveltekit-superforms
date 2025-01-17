<script lang="ts">
  import { tick } from 'svelte';
  import { superForm } from '$lib/client';
  import SuperDebug from '$lib/client/SuperDebug.svelte';
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { afterNavigate, goto } from '$app/navigation';

  export let data: PageData;

  let message = '';
  let dialog: HTMLDialogElement;

  const { form, tainted, enhance } = superForm(data.form, {
    taintedMessage: () => {
      dialog.showModal();
      return new Promise((resolve, reject) => {
        dialog.addEventListener('close', () => {
          // to discard redirection you can or reject the promise or resolve(false)
          if(dialog.returnValue === 'ok') {
            resolve(true);
          } else {
            reject();  // Could also be resolve(false)
          }
        }, {once: true});
      })
    }
  });

  function untaint() {
    if ($tainted) {
      $tainted.name = undefined;
      $tainted.city = false;
      delete $tainted.age;
    }
  }

  async function resetTainted() {
    if ($page.url.searchParams.has('timeout')) {
      setTimeout(untaint);
      message = 'timeout';
    } else {
      await tick();
      await tick();
      untaint();
      message = 'tick';
    }
  }

  afterNavigate((nav) => {
    console.log(nav);
    $form.name = 'Fred';
    $form.city = 'Berlin';
    $form.age = 28;

    resetTainted();
  });
</script>

<dialog bind:this={dialog}>
  <p>Do you want to leave this page? Changes you made may not be saved.</p>
  <div class="action-button">
    <button on:click={() => dialog.close('ok')}>Leave</button>
    <button on:click={() => dialog.close('ko')}>Stay</button>
  </div>
</dialog>

<a href="?">Use tick</a> |
<a href="?timeout">Use timeout</a> |
<a href="https://github.com/ciscoheat/sveltekit-superforms" rel="noreferrer">External link</a> |
<a href="/" on:click|preventDefault={() => goto('/')}>Programmatic link</a>

<h3>Triple Set via onMount</h3>

<h4>{message}</h4>

<form method="POST" use:enhance>
  <div>
    Name:
    <input type="text" name="name" bind:value={$form.name} />
  </div>

  <div>
    city:
    <input type="text" name="city" bind:value={$form.city} />
  </div>

  <div>
    Age:
    <input type="number" name="age" bind:value={$form.age} />
  </div>

  <div>
    <button type="submit">Submit</button>
  </div>
</form>

<h4>form</h4>
<SuperDebug data={$form} />
<h4>tainted</h4>
<SuperDebug data={$tainted} />

<style>
  .action-button {
    display: flex;
    justify-content: space-around;
  }
</style>