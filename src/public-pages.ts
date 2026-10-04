import type { Express } from "express";
import { connectPageBody } from "./connect-page.js";

export const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="#101418"/><rect x="58" y="48" width="140" height="160" rx="16" fill="none" stroke="#3dba8b" stroke-width="16"/><path d="M86 96h84M86 128h84M86 160h52" fill="none" stroke="#f4efe6" stroke-width="12" stroke-linecap="round"/></svg>`;

const page = (title: string, body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Catalog</title><link rel="icon" href="/icon.svg"><style>body{margin:0;background:#101418;color:#f4efe6;font:17px/1.65 system-ui}main{max-width:840px;margin:40px auto;padding:24px}a{color:#3dba8b}h1{line-height:1.15;font-size:40px}h2{margin-top:32px}h3{margin:18px 0 6px}nav,footer{display:flex;flex-wrap:wrap;gap:18px}section{border:1px solid #2a333c;border-radius:16px;padding:22px;margin:22px 0}input,textarea,select,button{font:inherit;box-sizing:border-box;max-width:100%;padding:10px;border:1px solid #2f6f56;border-radius:8px;background:#182026;color:inherit}input,textarea{width:100%}label{display:block;margin:12px 0}button{cursor:pointer;margin:12px 8px 12px 0}code,pre{overflow-wrap:anywhere}pre{overflow:auto;background:#182026;padding:12px;border-radius:8px}#message{white-space:pre-wrap}small{color:#b7c0c7}</style></head><body><main><nav><a href="/app">Catalog</a><a href="/connect">Connect an assistant</a><a href="/support">Support</a></nav><h1>${title}</h1>${body}<footer><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/data">Your data</a></footer></main></body></html>`;

export function installPublicPages(app: Express, baseUrl: string, supabaseUrl: string, anonKey: string) {
  app.get("/access", (_req, res) =>
    res.type("html").send(page(
      "Catalog access",
      `<p>Catalog tools are available with Catalog Pro or an active 14-day trial. This connection has no catalog-tool entitlement at present. It cannot change your plan or start a purchase.</p><p>Verify that you connected the intended account. <a href="/connections">Manage the connection</a> or <a href="/support">contact support</a> if access looks incorrect.</p>`
    ))
  );
  app.get("/icon.svg", (_req, res) => res.type("svg").send(logo));
  app.get("/connect", (_req, res) => res.type("html").send(page("Connect an assistant", connectPageBody(baseUrl))));
  app.get("/privacy", (_req, res) =>
    res.type("html").send(page(
      "Privacy policy",
      `<p>Effective October 4, 2026. Catalog is operated under the Hutchins App Studio brand. Contact the operator through the <a href="/support">support form</a>.</p>
<h2>Information we process</h2>
<p>We process account identifiers and email provided at sign-in, subscription status and billing references, and catalog content you send through the workspace or connected tools: stores, product names, specs, the prices you approve for assistants to state, and availability. Support requests contain the reply email and message you provide.</p>
<p>We do not receive every conversation automatically. Tools receive only their submitted arguments. Do not include passwords, payment card details, or unrelated personal information in catalog content.</p>
<h2>Why and where</h2>
<p>We use this information to provide Catalog, authenticate users, enforce subscriptions, respond to support, prevent abuse, and meet legal obligations. Supabase provides authentication and database hosting. The host you deploy runs the service. Google provides optional sign-in. Stripe processes payments. We do not store complete card numbers. Connected MCP clients, including ChatGPT, Claude, Gemini, Grok, Cursor, and other hosts you authorize, receive the catalog information their authorized tools request and apply their own privacy terms.</p>
<h2>Control and retention</h2>
<p>We do not sell catalog content or use it to train our own models. Saved stores remain until you delete them or request account deletion. <a href="/data">Export or delete a store</a>, including after a subscription ends. Billing records may be retained where accounting or dispute handling requires it.</p>
<p>Use support to request account deletion, correction, access, or questions about retention. The service uses sign-in storage to maintain your session. No advertising trackers are included.</p>
<h2>Security and changes</h2>
<p>Account authentication and database ownership rules protect catalogs. No service can promise absolute security. Policy changes are published here with an updated effective date.</p>`
    ))
  );
  app.get("/terms", (_req, res) =>
    res.type("html").send(page(
      "Terms of service",
      `<p>Effective October 4, 2026. These terms govern Catalog, offered under the Hutchins App Studio brand. Questions go through <a href="/support">support</a>.</p>
<h2>Your catalog content</h2>
<p>You retain your rights in content you submit. You grant the operator permission to host, process, retrieve, and transmit it only as needed to provide the service. Submit only content you have the right to use. Do not use the service unlawfully, attempt unauthorized access, or disrupt other users.</p>
<h2>Accounts and paid access</h2>
<p>Use your own account and protect your sign-in. Catalog tools require Catalog Pro or an active 14-day trial. Billing interval, trial length, and payment terms are shown by Stripe before purchase. Trials may convert to a recurring subscription as disclosed at checkout. Manage cancellation in the billing portal. Cancellation does not automatically delete your data. Contact support for billing mistakes or refund requests. Applicable consumer rights continue to apply.</p>
<h2>What Catalog checks</h2>
<p>check_shopping_copy rejects a draft when it states a spec, a price, or a stock level that is not in the approved catalog for an active product. The check is not a merchandising review and it does not promise that copy is complete, compliant, or ready to publish. You decide which specs, prices, and availability to save. The assistant calls tools only when you and the host allow it.</p>
<h2>Service operation</h2>
<p>We may change features or restrict access to address abuse, security issues, nonpayment, or legal obligations. We aim to provide reliable access but cannot promise uninterrupted operation or assistant output without mistakes. These terms do not remove rights that applicable law does not permit us to exclude.</p>
<h2>Leaving</h2>
<p>You can disconnect applications, export or delete stores, cancel billing, and request account deletion. Those controls are separate and are described on <a href="/data">Your data</a>.</p>`
    ))
  );
  app.get("/support", (_req, res) =>
    res.type("html").send(page(
      "Contact Catalog",
      `<p>Send a support, billing, privacy, or account-deletion request. Include a reply email. Do not send passwords, tokens, or payment card details.</p>
<form id="support"><label>Reply email<input name="email" type="email" required maxlength="254"></label><label>How can we help?<textarea name="message" required minlength="10" maxlength="4000" rows="7"></textarea></label><button>Send request</button></form>
<p id="message" role="status"></p>
<script>document.getElementById('support').onsubmit=async function(e){e.preventDefault();var b=this.querySelector('button');b.disabled=true;try{var r=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:this.email.value,message:this.message.value})});var d=await r.json();if(!r.ok)throw Error(d.error||'Unable to send');document.getElementById('message').textContent='Request received. Reference: '+d.id;this.reset()}catch(e){document.getElementById('message').textContent=e.message}finally{b.disabled=false}};</script>`
    ))
  );
  app.get("/data", (_req, res) =>
    res.type("html").send(page(
      "Your data",
      `<p>Export a store catalog or permanently delete a store and its products, specs, prices, and availability. These controls remain available after Pro ends.</p>
<p><a href="/app">Sign in first</a>. <a href="/connections">Disconnect applications</a> separately. Manage cancellation in the billing portal. For account deletion, use <a href="/support">support</a>.</p>
<section><label>Store<select id="stores"></select></label><button id="export" type="button">Download JSON</button><label>To delete, type the exact store name<input id="confirm" autocomplete="off"></label><button id="delete" type="button">Delete store</button><p id="message" role="status"></p></section>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js"></script>
<script>
(async function(){
  var cfg=${JSON.stringify({ url: supabaseUrl, key: anonKey }).replace(/</g, "\\u003c")};
  var status=document.getElementById('message'), select=document.getElementById('stores');
  if(!cfg.url||!cfg.key||!window.supabase){status.textContent='Sign-in is not configured yet.';return}
  var client=window.supabase.createClient(cfg.url,cfg.key);
  async function rest(path, options){
    var session=await client.auth.getSession();
    if(!session.data.session) throw Error('Sign in to Catalog first.');
    var headers=Object.assign({apikey:cfg.key,Authorization:'Bearer '+session.data.session.access_token}, (options&&options.headers)||{});
    var response=await fetch(cfg.url+path, Object.assign({}, options, {headers:headers}));
    var body=await response.text();
    if(!response.ok) throw Error('Request could not complete. Refresh and retry.');
    return body?JSON.parse(body):null;
  }
  async function load(){
    var rows=await rest('/rest/v1/catalog_stores?select=id,name&order=updated_at.desc&limit=50');
    select.replaceChildren();
    (rows||[]).forEach(function(store){select.add(new Option(store.name, store.id))});
    if(!(rows||[]).length) status.textContent='No stores to export or delete.';
  }
  document.getElementById('export').onclick=async function(){
    this.disabled=true;
    try{
      if(!select.value) throw Error('Choose a store first.');
      var id=encodeURIComponent(select.value);
      var data={
        store:(await rest('/rest/v1/catalog_stores?id=eq.'+id+'&select=*'))[0],
        products:await rest('/rest/v1/catalog_products?store_id=eq.'+id+'&select=*')
      };
      var url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      var link=document.createElement('a'); link.href=url; link.download='catalog-store.json'; link.click();
      setTimeout(function(){URL.revokeObjectURL(url)},1000);
      status.textContent='Catalog downloaded.';
    }catch(error){status.textContent=error.message}
    finally{this.disabled=false}
  };
  document.getElementById('delete').onclick=async function(){
    this.disabled=true;
    try{
      if(!select.value) throw Error('Choose a store first.');
      if(document.getElementById('confirm').value!==select.selectedOptions[0].textContent) throw Error('Type the exact store name to confirm deletion.');
      await rest('/rest/v1/catalog_stores?id=eq.'+encodeURIComponent(select.value),{method:'DELETE',headers:{Prefer:'return=minimal'}});
      document.getElementById('confirm').value='';
      await load();
      status.textContent='Store and its catalog were deleted.';
    }catch(error){status.textContent=error.message}
    finally{this.disabled=false}
  };
  try{await load()}catch(error){status.textContent=error.message}
})();
</script>`
    ))
  );
}

export { page };
