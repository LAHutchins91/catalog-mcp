import { landingConnectLead } from "./connect-page.js";

export function landingPage(appBaseUrl: string, supabaseUrl: string, supabaseAnonKey: string) {
  const supabaseUrlJson = JSON.stringify(supabaseUrl);
  const supabaseAnonKeyJson = JSON.stringify(supabaseAnonKey);
  const appBaseUrlJson = JSON.stringify(appBaseUrl);
  const connectLead = landingConnectLead(appBaseUrl);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Catalog</title>
  <link rel="icon" href="/icon.svg">
  <style>
    :root{color-scheme:dark;--bg:#101418;--line:#2a333c;--text:#f4efe6;--muted:#b7c0c7;--accent:#3dba8b;--ink:#182026}
    *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at 80% -10%,#14352c 0,transparent 32%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .shell{max-width:980px;margin:0 auto;padding:28px 20px 72px}.nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:48px}.brand{font-weight:800;letter-spacing:-.04em;font-size:22px}
    h1{font-size:clamp(44px,7vw,76px);line-height:.95;letter-spacing:-.05em;margin:12px 0} p{color:var(--muted);font-size:18px;line-height:1.6}
    .card{background:linear-gradient(180deg,#1b242b,#12181d);border:1px solid var(--line);border-radius:22px;padding:22px}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.btn{appearance:none;border:0;border-radius:12px;padding:12px 16px;font-weight:750;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
    .primary{background:var(--accent);color:#06281c}.secondary{background:var(--ink);color:var(--text);border:1px solid var(--line)}
    .plans{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.plan{border:1px solid var(--line);border-radius:20px;padding:22px;background:#12181d}.plan ul{padding-left:18px;color:var(--text)}
    .account{display:none;margin-top:18px}.account.show{display:block}.error,.notice{display:none;margin-top:14px;padding:12px;border-radius:12px}.error.show{display:block;background:#3a1c1c;color:#ffd0d0}.notice.show{display:block;background:#14352c;color:#d7f5d4}
    label{display:block;margin:12px 0 6px;color:var(--muted)} input,textarea,select{width:100%;padding:11px;border-radius:10px;border:1px solid var(--line);background:#0d1216;color:var(--text);font:inherit} textarea{min-height:90px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.footer{margin-top:56px;display:flex;gap:16px;flex-wrap:wrap;color:#8b979f}
    [hidden]{display:none!important} pre{white-space:pre-wrap;overflow-wrap:anywhere} @media(max-width:760px){.plans,.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="shell">
    <nav class="nav"><div class="brand">Catalog</div><span id="servicePill">Product facts</span></nav>
    <section>
      <p class="eyebrow">Approved specs, prices, and stock</p>
      <h1 id="heroTitle">Do not invent the product.</h1>
      <p id="heroDescription">Catalog stores the specs, the price, and the availability a store allows an assistant to state, then checks a draft before that assistant can invent one.</p>
      ${connectLead}
      <div class="actions" id="signedOutActions"><button class="btn primary" id="googleBtn" type="button">Continue with Google</button><a class="btn secondary" href="#plans">See plans</a></div>
      <div class="card account" id="accountCard"><div id="userEmail"></div><div id="subscriptionStatus">Checking account…</div><div class="actions"><button class="btn secondary" id="signOutBtn" type="button">Sign out</button></div></div>
      <div class="actions" id="proActions" hidden><a class="btn primary" href="/app">Open catalog workspace</a></div>
      <button class="btn secondary" id="refreshAccount" type="button" hidden>Refresh subscription status</button>
      <div class="notice" id="notice" role="status"></div>
      <div class="error" id="error" role="alert"></div>
    </section>
    <section id="plans">
      <h2>Start with a 14-day trial</h2>
      <p>Then continue on Pro. Secure checkout and subscription billing are handled by Stripe.</p>
      <div class="plans">
        <article class="plan"><h3>Monthly</h3><p>Pro, billed each month after the trial.</p><ul><li>Approved specs</li><li>Prices the store allows</li><li>In stock, out of stock, or a quantity</li><li>Draft checks</li></ul><button class="btn secondary checkout" type="button" data-plan="monthly">Start monthly trial</button></article>
        <article class="plan"><h3>Yearly</h3><p>Pro, billed once a year after the same 14-day trial.</p><ul><li>Everything in Monthly</li><li>One annual billing cycle</li><li>ChatGPT, Claude, Gemini, Grok, and Cursor</li><li>Any Streamable HTTP OAuth client</li></ul><button class="btn primary checkout" type="button" data-plan="annual">Start yearly trial</button></article>
      </div>
    </section>
    <section id="workspace" hidden>
      <h2>Catalog workspace</h2>
      <p>Save products here, or ask a connected assistant to save them. The check uses the same rules as the Catalog tool.</p>
      <div class="grid">
        <form class="card" id="storeForm"><h3>New store</h3><label for="storeName">Name</label><input id="storeName" required minlength="2" maxlength="200"><button class="btn primary" type="submit">Create store</button></form>
        <div class="card"><h3>Your stores</h3><label for="storeSelect">Open</label><select id="storeSelect"><option value="">Choose a store</option></select><p id="workspaceMessage" role="status"></p></div>
      </div>
      <div id="editor" hidden>
        <form class="card" id="productForm"><h3>Product</h3>
          <label for="productName">Name</label><input id="productName" required minlength="2" maxlength="200">
          <label for="productSku">SKU, optional</label><input id="productSku" maxlength="80">
          <label for="priceAmount">Price amount the assistant may state</label><input id="priceAmount" type="number" min="0" max="999999.99" step="0.01" required>
          <label for="priceCurrency">Price currency</label><input id="priceCurrency" required minlength="3" maxlength="3" value="USD">
          <label for="availability">Availability</label><select id="availability"><option value="in_stock">in stock</option><option value="out_of_stock">out of stock</option><option value="quantity">quantity</option></select>
          <label for="quantity">Quantity, required only for quantity</label><input id="quantity" type="number" min="0" max="1000000" step="1">
          <label for="specs">Specs, one label: value per line</label><textarea id="specs" maxlength="20000" placeholder="material: wool"></textarea>
          <label for="productStatus">Status</label><select id="productStatus"><option>ACTIVE</option><option>RETIRED</option></select>
          <button class="btn primary" type="submit">Save product</button>
        </form>
        <form class="card" id="checkForm"><h3>Check a draft</h3><label for="draft">Draft shopping copy</label><textarea id="draft" required maxlength="12000"></textarea><button class="btn primary" type="submit">Check draft</button><pre id="checkResult"></pre></form>
        <section class="card"><h3>Saved catalog</h3><pre id="guide"></pre></section>
      </div>
    </section>
    <footer class="footer"><a href="/connect">Connect an assistant</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><a href="/data">Your data</a><a href="/health">System health</a></footer>
  </main>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js"></script>
  <script>
  (function(){
    var SUPABASE_URL=${supabaseUrlJson};
    var SUPABASE_ANON_KEY=${supabaseAnonKeyJson};
    var APP_BASE_URL=${appBaseUrlJson};
    var token='', current=null, isPro=false, profileReady=false, stores=[], selected='';
    function el(id){return document.getElementById(id)}
    function showError(msg){el('error').textContent=msg; el('error').classList.add('show')}
    function clearError(){el('error').classList.remove('show')}
    function renderAccess(pro, ready){
      isPro=pro; profileReady=ready;
      el('plans').hidden=pro;
      el('proActions').hidden=!pro || location.pathname==='/app';
      el('workspace').hidden=!(pro && location.pathname==='/app');
      el('heroTitle').textContent=pro?'Your catalog is ready.':'Do not invent the product.';
      document.querySelectorAll('.checkout').forEach(function(btn){btn.disabled=!ready||pro});
    }
    function setSignedOut(){token=''; current=null; renderAccess(false,true); el('refreshAccount').hidden=true; el('signedOutActions').hidden=false; el('accountCard').classList.remove('show')}
    function setSignedIn(session){
      current=session; token=session.access_token||'';
      if(!token){setSignedOut(); return}
      el('userEmail').textContent=session.user.email||'Signed in';
      el('signedOutActions').hidden=true; el('accountCard').classList.add('show');
    }
    async function api(path, options){
      var opts=options||{}; opts.headers=Object.assign({apikey:SUPABASE_ANON_KEY}, opts.headers||{});
      if(token) opts.headers.Authorization='Bearer '+token;
      var response=await fetch(SUPABASE_URL+path, opts);
      var body=await response.text();
      if(!response.ok) throw Error('Request failed');
      return body?JSON.parse(body):null;
    }
    async function loadProfile(session){
      el('refreshAccount').hidden=false;
      try{
        var rows=await api('/rest/v1/profiles?id=eq.'+encodeURIComponent(session.user.id)+'&select=subscription_status');
        var status=rows&&rows[0]&&rows[0].subscription_status;
        var pro=status==='trialing'||status==='active';
        renderAccess(pro, true);
        el('subscriptionStatus').textContent=pro?(status==='trialing'?'Catalog Pro · 14-day trial in progress':'Catalog Pro · Active'):'Signed in · start a 14-day trial below';
        if(pro && location.pathname==='/app') await loadStores();
      }catch(e){renderAccess(false,false); el('subscriptionStatus').textContent='Unable to confirm the subscription. Refresh and retry.'}
    }
    function say(message){el('workspaceMessage').textContent=message}
    async function loadStores(preferred){
      var rows=await api('/rest/v1/catalog_stores?select=id,name&order=updated_at.desc&limit=50');
      stores=rows||[];
      el('storeSelect').replaceChildren(new Option('Choose a store',''));
      stores.forEach(function(store){el('storeSelect').add(new Option(store.name, store.id))});
      selected=stores.some(function(store){return store.id===preferred})?preferred:'';
      el('storeSelect').value=selected;
      await loadGuide();
    }
    async function loadGuide(){
      el('editor').hidden=!selected;
      el('guide').textContent='';
      if(!selected) return;
      var id=encodeURIComponent(selected);
      var guide={
        store:(await api('/rest/v1/catalog_stores?id=eq.'+id+'&select=id,name'))[0],
        products:await api('/rest/v1/catalog_products?store_id=eq.'+id+'&select=id,name,sku,specs,price_amount,price_currency,availability,quantity,status,revision&order=updated_at.desc')
      };
      el('guide').textContent=JSON.stringify(guide,null,2);
    }
    function parseSpecs(text){
      return text.split('\\n').map(function(line){return line.trim()}).filter(Boolean).map(function(line){
        var splitAt=line.indexOf(':');
        if(splitAt<1) throw Error('Each spec line needs a label and a value, separated by a colon.');
        var label=line.slice(0,splitAt).trim();
        var value=line.slice(splitAt+1).trim();
        if(!label||!value) throw Error('Each spec line needs a label and a value, separated by a colon.');
        return {label:label,value:value};
      });
    }
    el('storeSelect').onchange=function(){selected=this.value; loadGuide().catch(function(){say('Could not load that store.')})};
    el('storeForm').onsubmit=function(event){
      event.preventDefault();
      var name=el('storeName').value.trim(); if(!name||!current) return;
      var form=this;
      say('Saving…');
      api('/rest/v1/catalog_stores',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({owner_id:current.user.id,name:name})})
        .then(function(rows){form.reset(); return loadStores(rows[0].id)}).then(function(){say('Store created.')})
        .catch(function(){say('Could not save. Your text is still here.')});
    };
    el('productForm').onsubmit=function(event){
      event.preventDefault();
      if(!selected||!current) return;
      var availability=el('availability').value;
      var quantityText=el('quantity').value.trim();
      var form=this;
      say('Saving…');
      try{
        var specs=parseSpecs(el('specs').value);
        var payload={
          store_id:selected,
          name:el('productName').value.trim(),
          sku:el('productSku').value.trim()||null,
          specs:specs,
          price_amount:Number(el('priceAmount').value),
          price_currency:el('priceCurrency').value.trim().toUpperCase(),
          availability:availability,
          quantity:availability==='quantity'?Number(quantityText):null,
          status:el('productStatus').value
        };
        if(availability==='quantity'&&quantityText==='') throw Error('Enter a quantity.');
        api('/rest/v1/catalog_products',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)})
          .then(function(){form.reset(); el('priceCurrency').value='USD'; el('availability').value='in_stock'; return loadGuide()})
          .then(function(){say('Product saved.')})
          .catch(function(){say('Could not save. Your text is still here.')});
      }catch(error){say(error.message||'Could not save. Your text is still here.')}
    };
    el('checkForm').onsubmit=async function(event){
      event.preventDefault();
      el('checkResult').textContent='Checking…';
      try{
        var response=await fetch('/api/check',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({storeId:selected,draft:el('draft').value})});
        var body=await response.json();
        el('checkResult').textContent=body.error||JSON.stringify(body,null,2);
      }catch(error){el('checkResult').textContent=error.message||'Could not check this draft.'}
    };
    function resumePlugin(){
      try{
        var saved=sessionStorage.getItem('catalogPluginReturn'); if(!saved) return false;
        sessionStorage.removeItem('catalogPluginReturn');
        var pending=JSON.parse(saved);
        if(!pending||Date.now()-pending.createdAt>600000) return false;
        location.assign(pending.id?'/oauth/consent?authorization_id='+encodeURIComponent(pending.id):'/connections');
        return true;
      }catch(e){return false}
    }
    var client=null;
    async function init(){
      if(!SUPABASE_URL||!SUPABASE_ANON_KEY||!window.supabase){setSignedOut(); showError('Google sign-in is not configured yet.'); return}
      client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{flowType:'implicit',persistSession:true,detectSessionInUrl:true,autoRefreshToken:true}});
      var result=await client.auth.getSession();
      var session=result.data&&result.data.session;
      if(session){ if(resumePlugin()) return; setSignedIn(session); await loadProfile(session); }
      else setSignedOut();
      client.auth.onAuthStateChange(function(_event, session){
        if(session){setSignedIn(session); loadProfile(session)} else setSignedOut();
      });
    }
    el('googleBtn').onclick=async function(){
      clearError(); if(!client){showError('Google sign-in is still loading.'); return}
      this.disabled=true;
      var result=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:APP_BASE_URL+'/'}});
      if(result.error){this.disabled=false; showError(result.error.message||'Google sign-in failed.')}
    };
    el('signOutBtn').onclick=async function(){ if(client) await client.auth.signOut(); setSignedOut(); location.href='/'; };
    el('refreshAccount').onclick=function(){ if(current) loadProfile(current); };
    document.querySelectorAll('.checkout').forEach(function(btn){
      btn.onclick=async function(){
        clearError();
        if(!token){showError('Sign in with Google first.'); return}
        btn.disabled=true;
        try{
          var response=await fetch('/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({plan:btn.getAttribute('data-plan')})});
          var data=await response.json();
          if(!response.ok) throw Error(data.error||'Unable to start checkout');
          location.href=data.url;
        }catch(error){showError(error.message); btn.disabled=false}
      };
    });
    var checkout=new URLSearchParams(location.search).get('checkout');
    if(checkout==='success'){el('notice').textContent='Checkout completed. Your subscription is being confirmed.'; el('notice').classList.add('show')}
    if(checkout==='cancelled') showError('Checkout was cancelled. No changes were made.');
    init();
  })();
  </script>
</body></html>`;
}
