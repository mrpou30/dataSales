/*
  IMPORTANT:
  - Ganti WEB_APP_URL sesuai URL Web App (Deploy -> Anyone, get URL)
*/
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzS8lxmff2vrLEod-z-TK83zAFeB12125kJh0Jrn7OIrBLISP5zVfvS5_aMdfOdePbA/exec";
// HAPUS SPASI DI AKHIR URL — INI PENYEBAB ERROR FETCH!

// ---------- UI refs ----------
const loginPage = document.getElementById("loginPage");
const dataPage = document.getElementById("dataPage");
const btnLogin = document.getElementById("btnLogin");
const loginStatus = document.getElementById("loginStatus");
const btnTampilkan = document.getElementById("btnTampilkan");
const tbody = document.querySelector("#dataTable tbody");
const tableMsg = document.getElementById("tableMsg");
const btnLogout = document.getElementById("btnLogout");

// ---------- helpers ----------
function showLoginError(msg){
  loginStatus.style.display = "block";
  loginStatus.style.color = "#b03b3b";
  loginStatus.textContent = msg;
}
function showLoginInfo(msg){
  loginStatus.style.display = "block";
  loginStatus.style.color = "#2b7a2b";
  loginStatus.textContent = msg;
}
function clearLoginMsg(){ loginStatus.style.display="none"; loginStatus.textContent=""; }

// format tanggal dari "yyyy-mm-dd" atau dari Date object
function formatTanggal(strOrDate){
  if(!strOrDate) return "";
  if(typeof strOrDate === "string"){
    // coba jika format yyyy-mm-dd atau yyyy/mm/dd
    const m = strOrDate.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if(m){
      const y=m[1], mo=m[2].padStart(2,"0"), d=m[3].padStart(2,"0");
      return `${d}/${mo}/${y}`;
    }
    // fallback parse
    const d = new Date(strOrDate);
    if(!isNaN(d)) return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    return strOrDate;
  } else if(strOrDate instanceof Date){
    const d=strOrDate;
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  } else return "";
}

function numberFmt(n){
  try {
    const nf = new Intl.NumberFormat('id-ID');
    return nf.format(Number(n));
  } catch(e){ return n; }
}

// ---------- populate bulan/tahun ----------
function isiDropdownBulanTahun(){
  const bulanEl = document.getElementById("bulan");
  const tahunEl = document.getElementById("tahun");
  const bulanList = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const now = new Date();
  bulanEl.innerHTML = bulanList.map((b,i)=>`<option value="${i+1}" ${i===now.getMonth()?"selected":""}>${b}</option>`).join("");
  const tahunNow = now.getFullYear();
  let html = "";
  for(let t=tahunNow-2; t<=tahunNow+2; t++){
    html += `<option value="${t}" ${t===tahunNow?"selected":""}>${t}</option>`;
  }
  tahunEl.innerHTML = html;
}

// ---------- LOGIN ----------
btnLogin.addEventListener("click", async () => {
  clearLoginMsg();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if(!username || !password){ showLoginError("Isi username dan password!"); return; }

  btnLogin.disabled = true;
  btnLogin.textContent = "Memproses...";

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({action:"login", username, password})
    });

    if(!res.ok) throw new Error("HTTP "+res.status);
    const json = await res.json();

    if(json && json.success){
      showLoginInfo("Login berhasil ✓");
      // tampilkan halaman data
      loginPage.classList.add("hidden");
      dataPage.classList.remove("hidden");
      isiDropdownBulanTahun();
      // reset pesan kecil setelah 1s
      setTimeout(()=>clearLoginMsg(),1000);
    } else {
      showLoginError(json && json.message ? json.message : "Login gagal");
    }
  } catch(err){
    showLoginError("Error: " + err.message);
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Masuk";
  }
});

// clear login msg when typing
document.getElementById("username").addEventListener("input", clearLoginMsg);
document.getElementById("password").addEventListener("input", clearLoginMsg);

// ---------- LOGOUT ----------
btnLogout.addEventListener("click", ()=>{
  dataPage.classList.add("hidden");
  loginPage.classList.remove("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  tbody.innerHTML = "";
  tableMsg.textContent = "";
});

// ---------- AMBIL DATA (GET) ----------
btnTampilkan.addEventListener("click", async function(){
  const btn = this;
  btn.disabled = true;
  btn.textContent = "Sedang mengambil...";
  tbody.innerHTML = "";
  tableMsg.textContent = "";

  const bulan = document.getElementById("bulan").value;
  const tahun = document.getElementById("tahun").value;

  try {
    const res = await fetch(`${WEB_APP_URL}?bulan=${encodeURIComponent(bulan)}&tahun=${encodeURIComponent(tahun)}`);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    if(!Array.isArray(data)){
      tableMsg.textContent = "Response tidak berformat array. Periksa GAS.";
      return;
    }
    if(data.length === 0){
      tableMsg.textContent = "Tidak ada data untuk bulan/tahun yang dipilih.";
      return;
    }

    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatTanggal(row.tanggal)}</td>
        <td>${row.hari ?? ""}</td>
        <td>${numberFmt(row.mtd ?? "")}</td>
        <td>${numberFmt(row.budget ?? "")}</td>
        <td>${numberFmt(row.overloss ?? "")}</td>
        <td>${row.persen ?? ""}%</td>
      `;
      tbody.appendChild(tr);
    });

  } catch(err){
    tableMsg.textContent = "Gagal ambil data: " + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Tampilkan";
  }
});
