// LabInventory - prototipe lokal dengan penyimpanan browser (localStorage)
const DEFAULT_USERS = [
  {username:"admin", password:"admin123", role:"Admin", active:true, name:"Administrator"},
  {username:"staff", password:"staff123", role:"Staff", active:true, name:"Staff Laboratorium"}
];
const DEFAULT_ITEMS = [
  {kode:"BR001",nama:"Laptop Lenovo",kategori:"Laptop",stok:5},
  {kode:"BR002",nama:"Mouse Logitech",kategori:"Aksesoris",stok:10},
  {kode:"BR003",nama:"Keyboard Mechanical",kategori:"Aksesoris",stok:8},
  {kode:"BR004",nama:"Proyektor Epson",kategori:"Proyektor",stok:3},
  {kode:"BR005",nama:"Monitor LG",kategori:"Monitor",stok:6}
];
const load = (key, fallback) => {
  try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
let users=load("lab_users",DEFAULT_USERS), items=load("lab_items",DEFAULT_ITEMS);
let loans=load("lab_loans",[]), currentUser=null, activePage="dashboard";
function saveAll(){localStorage.setItem("lab_users",JSON.stringify(users));localStorage.setItem("lab_items",JSON.stringify(items));localStorage.setItem("lab_loans",JSON.stringify(loans));}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400);}
document.getElementById("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const u=document.getElementById("username").value.trim(), p=document.getElementById("password").value;
  const found=users.find(x=>x.username===u&&x.password===p&&x.active!==false);
  if(!found){alert("Username/password salah atau akun dinonaktifkan.");return;}
  currentUser=found; document.getElementById("loginPage").classList.add("hidden");document.getElementById("app").classList.remove("hidden");
  document.getElementById("sidebarUser").textContent=found.name||found.username;document.getElementById("sidebarRole").textContent=found.role==="Admin"?"Administrator":"Petugas Laboratorium";
  document.getElementById("userAvatar").textContent=(found.name||found.username).charAt(0).toUpperCase();document.getElementById("topAvatar").textContent=(found.name||found.username).charAt(0).toUpperCase();
  document.getElementById("todayLabel").textContent=new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
  buildMenu();showPage("dashboard");
});
function buildMenu(){
 const entries=[["dashboard","▦  Dashboard"],["items",currentUser.role==="Admin"?"▤  Data Barang":"▤  Daftar Barang"],["borrow","⇧  Peminjaman"],["return","⇩  Pengembalian"],["history","◷  Riwayat Transaksi"]];
 if(currentUser.role==="Admin")entries.push(["users","♙  Data Staff"]);
 document.getElementById("menuList").innerHTML=entries.map(([id,label])=>`<button class="nav-link" data-page="${id}">${label}</button>`).join("");
 document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
}
function showPage(page){
 activePage=page;document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 const titles={dashboard:"Dashboard",items:currentUser.role==="Admin"?"Data Barang":"Daftar Barang",borrow:"Peminjaman Barang",return:"Pengembalian Barang",history:"Riwayat Transaksi",users:"Manajemen Staff"};
 document.getElementById("pageTitle").textContent=titles[page]||"Dashboard";
 const content=document.getElementById("pageContent");
 if(page==="dashboard")renderDashboard(content);
 if(page==="items")renderItems(content);
 if(page==="borrow")renderBorrow(content);
 if(page==="return")renderReturn(content);
 if(page==="history")renderHistory(content);
 if(page==="users"&&currentUser.role==="Admin")renderUsers(content);
}
function renderDashboard(root){
 const total=items.reduce((s,x)=>s+x.stok,0), borrowed=loans.filter(x=>x.status==="Dipinjam").reduce((s,x)=>s+x.jumlah,0);
 root.innerHTML=`<section class="welcome"><h2>Selamat datang, ${esc(currentUser.name||currentUser.username)}!</h2><p>Kelola inventaris dan aktivitas peminjaman laboratorium dalam satu tempat.</p></section>
 <section class="stats-grid"><div class="stat-card"><span class="stat-icon">▤</span><span>Total Stok Barang</span><strong>${total}</strong></div><div class="stat-card"><span class="stat-icon">✓</span><span>Barang Tersedia</span><strong>${total}</strong></div><div class="stat-card"><span class="stat-icon">⇧</span><span>Barang Dipinjam</span><strong>${borrowed}</strong></div><div class="stat-card"><span class="stat-icon">◷</span><span>Total Transaksi</span><strong>${loans.length}</strong></div></section>
 <section class="panel"><div class="panel-head"><h3>Aktivitas Terbaru</h3><span class="muted">5 aktivitas terakhir</span></div>${loans.length?`<div class="activity-list">${[...loans].reverse().slice(0,5).map(x=>`<div class="activity-row"><span><b>${esc(x.namaPeminjam)}</b> — ${esc(x.namaBarang)} (${x.jumlah})</span><span class="muted">${esc(x.status)} · ${esc(x.tanggalPinjam)}</span></div>`).join("")}</div>`:`<div class="empty">Belum ada aktivitas. Transaksi baru akan muncul di sini.</div>`}</section>`;
}
function renderItems(root){
 const admin=currentUser.role==="Admin";
 root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>Daftar Inventaris</h3><span class="muted">Data perlengkapan laboratorium</span></div>${admin?'<button class="btn btn-blue" id="addItemBtn">+ Tambah Barang</button>':''}</div><div class="toolbar"><input id="itemSearch" placeholder="Cari kode atau nama barang..."></div><div id="itemTable"></div></section>`;
 const draw=()=>{const q=document.getElementById("itemSearch").value.toLowerCase();const rows=items.filter(x=>(x.kode+x.nama+x.kategori).toLowerCase().includes(q));document.getElementById("itemTable").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th>${admin?'<th>Aksi</th>':''}</tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.kode)}</td><td><b>${esc(x.nama)}</b></td><td>${esc(x.kategori)}</td><td>${x.stok}</td>${admin?`<td><button class="btn btn-small btn-light" data-edit="${esc(x.kode)}">Edit</button><button class="btn btn-small btn-danger" data-delete="${esc(x.kode)}">Hapus</button></td>`:''}</tr>`).join("")}</tbody></table></div>`:'<div class="empty">Barang tidak ditemukan.</div>';
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editItem(b.dataset.edit));document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteItem(b.dataset.delete));};
 document.getElementById("itemSearch").addEventListener("input",draw);draw();
 if(admin)document.getElementById("addItemBtn").onclick=()=>itemForm();
}
function itemForm(item=null){
 const edit=!!item, code=item?.kode||"";
 document.getElementById("pageContent").innerHTML=`<section class="form-panel"><h3>${edit?"Edit Barang":"Tambah Barang"}</h3><form id="itemForm"><div class="form-grid"><div><label>Kode Barang</label><input name="kode" value="${esc(code)}" ${edit?"readonly":""} required placeholder="BR006"></div><div><label>Nama Barang</label><input name="nama" value="${esc(item?.nama||"")}" required></div><div><label>Kategori</label><input name="kategori" value="${esc(item?.kategori||"")}" required placeholder="Contoh: Laptop"></div><div><label>Stok</label><input name="stok" type="number" min="0" value="${item?.stok??0}" required></div></div><div class="form-actions"><button class="btn btn-blue">Simpan</button><button type="button" class="btn btn-light" id="cancelItem">Batal</button></div></form></section>`;
 document.getElementById("cancelItem").onclick=()=>showPage("items");
 document.getElementById("itemForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),data={kode:f.get("kode").trim().toUpperCase(),nama:f.get("nama").trim(),kategori:f.get("kategori").trim(),stok:Number(f.get("stok"))};if(!edit&&items.some(x=>x.kode===data.kode)){alert("Kode barang sudah digunakan.");return;}if(edit){const old=items.find(x=>x.kode===code);old.nama=data.nama;old.kategori=data.kategori;old.stok=data.stok;}else items.push(data);saveAll();toast("Data barang berhasil disimpan.");showPage("items");};
}
function editItem(code){const item=items.find(x=>x.kode===code);if(item)itemForm(item);}
function deleteItem(code){if(loans.some(x=>x.kode===code&&x.status==="Dipinjam")){alert("Barang masih dipinjam dan belum dapat dihapus.");return;}if(confirm("Hapus barang "+code+"?")){items=items.filter(x=>x.kode!==code);saveAll();showPage("items");toast("Barang dihapus.");}}
function renderBorrow(root){
 const available=items.filter(x=>x.stok>0);
 root.innerHTML=`<section class="form-panel"><h3>Formulir Peminjaman</h3><p class="muted" style="margin:7px 0 15px">Isi data peminjam dan barang yang akan dipinjam.</p><form id="borrowForm"><div class="form-grid"><div><label>Nama Peminjam</label><input name="nama" required placeholder="Nama lengkap peminjam"></div><div><label>Barang</label><select name="kode" required>${available.map(x=>`<option value="${esc(x.kode)}">${esc(x.nama)} — stok ${x.stok}</option>`).join("")}</select></div><div><label>Jumlah</label><input name="jumlah" type="number" min="1" value="1" required></div><div><label>Tanggal Peminjaman</label><input name="tanggal" type="date" value="${new Date().toISOString().slice(0,10)}" required></div></div><div class="form-actions"><button class="btn btn-blue" ${available.length?"":"disabled"}>Simpan Peminjaman</button></div></form>${available.length?"":'<p class="empty">Tidak ada stok barang yang tersedia.</p>'}</section>`;
 document.getElementById("borrowForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),item=items.find(x=>x.kode===f.get("kode")),jumlah=Number(f.get("jumlah"));if(!item||jumlah<1||jumlah>item.stok){alert("Jumlah melebihi stok yang tersedia.");return;}item.stok-=jumlah;loans.push({id:Date.now(),namaPeminjam:f.get("nama").trim(),kode:item.kode,namaBarang:item.nama,jumlah,tanggalPinjam:f.get("tanggal"),tanggalKembali:"",status:"Dipinjam",petugas:currentUser.username});saveAll();toast("Peminjaman berhasil dicatat.");showPage("dashboard");};
}
function renderReturn(root){
 const pending=loans.filter(x=>x.status==="Dipinjam");
 root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>Pengembalian Barang</h3><span class="muted">Pilih transaksi yang akan dikembalikan</span></div></div>${pending.length?`<div class="table-wrap"><table><thead><tr><th>Peminjam</th><th>Barang</th><th>Jumlah</th><th>Tanggal Pinjam</th><th>Aksi</th></tr></thead><tbody>${pending.map(x=>`<tr><td>${esc(x.namaPeminjam)}</td><td>${esc(x.namaBarang)}</td><td>${x.jumlah}</td><td>${esc(x.tanggalPinjam)}</td><td><button class="btn btn-small btn-success" data-return="${x.id}">Proses Pengembalian</button></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Tidak ada barang yang sedang dipinjam.</div>'}</section>`;
 document.querySelectorAll("[data-return]").forEach(b=>b.onclick=()=>{const loan=loans.find(x=>x.id===Number(b.dataset.return));if(!loan||loan.status!=="Dipinjam")return;if(confirm("Proses pengembalian barang ini?")){const item=items.find(x=>x.kode===loan.kode);if(item)item.stok+=loan.jumlah;loan.status="Selesai";loan.tanggalKembali=new Date().toISOString().slice(0,10);loan.petugasKembali=currentUser.username;saveAll();toast("Barang berhasil dikembalikan.");showPage("return");}});
}
function renderHistory(root){
 const rows=[...loans].reverse();
 root.innerHTML=`<section class="panel"><div class="panel-head"><h3>Riwayat Peminjaman & Pengembalian</h3><span class="muted">${rows.length} transaksi</span></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>Peminjam</th><th>Barang</th><th>Jumlah</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.namaPeminjam)}</td><td>${esc(x.namaBarang)}</td><td>${x.jumlah}</td><td>${esc(x.tanggalPinjam)}</td><td>${esc(x.tanggalKembali||"-")}</td><td><span class="badge ${x.status==="Selesai"?"badge-green":"badge-orange"}">${x.status}</span></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Belum ada riwayat transaksi.</div>'}</section>`;
}
function renderUsers(root){
 root.innerHTML=`<section class="panel"><div class="panel-head"><div><h3>Daftar Staff</h3><span class="muted">Kelola akun petugas laboratorium</span></div><button class="btn btn-blue" id="addUserBtn">+ Tambah Staff</button></div><div class="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${users.filter(x=>x.role==="Staff").map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.username)}</td><td><span class="badge ${x.active?"badge-green":"badge-gray"}">${x.active?"Aktif":"Nonaktif"}</span></td><td><button class="btn btn-small btn-light" data-toggle="${esc(x.username)}">${x.active?"Nonaktifkan":"Aktifkan"}</button><button class="btn btn-small btn-danger" data-remove="${esc(x.username)}">Hapus</button></td></tr>`).join("")||'<tr><td colspan="4" class="empty">Belum ada akun Staff.</td></tr>'}</tbody></table></div></section>`;
 document.getElementById("addUserBtn").onclick=()=>userForm();
 document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const u=users.find(x=>x.username===b.dataset.toggle);u.active=!u.active;saveAll();renderUsers(root);});
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{if(confirm("Hapus akun Staff ini?")){users=users.filter(x=>x.username!==b.dataset.remove);saveAll();renderUsers(root);}});
}
function userForm(){
 document.getElementById("pageContent").innerHTML=`<section class="form-panel"><h3>Tambah Akun Staff</h3><form id="userForm"><div class="form-grid"><div><label>Nama Staff</label><input name="name" required></div><div><label>Username</label><input name="username" required></div><div><label>Password</label><input name="password" type="password" minlength="6" required></div></div><div class="form-actions"><button class="btn btn-blue">Simpan</button><button type="button" class="btn btn-light" id="cancelUser">Batal</button></div></form></section>`;
 document.getElementById("cancelUser").onclick=()=>showPage("users");
 document.getElementById("userForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),username=f.get("username").trim();if(users.some(x=>x.username===username)){alert("Username sudah digunakan.");return;}users.push({name:f.get("name").trim(),username,password:f.get("password"),role:"Staff",active:true});saveAll();toast("Akun Staff berhasil dibuat.");showPage("users");};
}
document.getElementById("logoutBtn").onclick=()=>{currentUser=null;document.getElementById("app").classList.add("hidden");document.getElementById("loginPage").classList.remove("hidden");document.getElementById("loginForm").reset();};
saveAll();
