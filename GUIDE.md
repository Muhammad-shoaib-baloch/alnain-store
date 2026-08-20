# Al Nain Store — Mukammal Guide (Roman Urdu)

Yeh guide aapke (store ke malik ke) liye hai — poora system samajhne ke liye. Technical hone ki zaroorat nahi.

---

## 1. Yeh project hai kya?

Aapki website **3 hisson** se milkar banti hai:

```
[Customer ka Browser]  ←→  [Website (React)]  ←→  [API (PHP)]  ←→  [Database (MySQL)]
      alnain.pk              public_html            /api folder        StackCP MySQL
```

1. **Website (frontend)** — jo customer ko nazar aati hai: home page, products, cart, checkout. Yeh React mein bani hai aur `public_html` mein static files ki shakal mein parhi hai (`index.html`, `assets`, `images`).
2. **API (backend)** — `public_html/api` folder ke andar PHP ki files. Website ka sara data isi se aata-jata hai: products load karna, order save karna, login, sab kuch.
3. **Database** — MySQL, jo StackCP pe bana hai. Products, orders, customers, messages — asal data yahan mehfooz hai.

**Aik jumle mein:** Customer website dekhta hai → website API se baat karti hai → API database mein parhta/likhta hai.

---

## 2. Kaunsi cheez kahan hai (server pe)

`public_html` ke andar:

| Cheez | Kya hai | Haath lagana? |
|---|---|---|
| `index.html`, `assets/`, `images/`, `.htaccess` | Aapki website | Update ke waqt replace hoti hain |
| `api/` | Backend (PHP files) | Update ke waqt replace; **`api/config.php` kabhi delete/overwrite nahi** |
| `api/config.php` | Database ka password + settings | Sirf aapke paas; GitHub pe nahi jata |
| `api/uploads/` | Admin se upload ki hui product photos | Kabhi delete nahi karna |
| `bot/`, `card/`, `molty/`, `public_html2/` | Aapki DOOSRI websites | **Kabhi haath nahi lagana** |

---

## 3. Admin Panel — rozana ka kaam yahan hota hai

**Login:** `alnain.pk/login` → apna admin email/password.

| Section | Kaam |
|---|---|
| **Dashboard** | Sales, orders, charts — sab ka overview |
| **Products** | Naya product add karein (naam, price, sizes, colors, photos) — publish karte hi customers ko dikhta hai |
| **Orders** | Har COD order yahan aata hai → Confirm → Shipped (tracking number dal kar) → Delivered |
| **Messages** | Contact form ke messages (unread ka badge sidebar pe) |
| **Coupons** | Discount codes banayen (percentage/fixed, expiry, limits) |
| **Inventory** | Stock kam/zyada karein |
| **Banners** | Homepage ka hero aur campaign banner |
| **Social Links** | Instagram/Facebook/WhatsApp ke links — footer aur WhatsApp button inhi se chalta hai |
| **Settings** | Store ka naam, email, shipping fees, free-shipping limit, tax, payment methods, GTM ID |

**Order ka flow:** Customer order karta hai → aapke panel mein "Pending" → aap Confirm karein → pack kar ke Shipped (tracking dalein) → deliver hone pe Delivered + payment "Paid". Customer apne account mein yeh sab live dekhta hai.

---

## 4. GitHub kya hai aur kyun?

**GitHub = code ki tijori + history.** `github.com/Muhammad-shoaib-baloch/alnain-store` pe poore project ka code mehfooz hai.

- Har change ek **commit** hota hai (jaise photo ke sath likha ho "yeh change kiya, is din")
- Kabhi kuch kharab ho jaye to purane version pe wapas ja sakte hain
- Computer kharab ho jaye to code GitHub se wapas mil jata hai
- **Password wali files (config.php) GitHub pe NAHI jatin** — yeh jaan boojh kar hai

Aapko GitHub pe kuch *karna* nahi hota — yeh backup/record ke liye hai. Changes main karta hoon aur push kar deta hoon.

---

## 5. Future mein change kaise hogi? (Update ka tareeqa)

1. Aap mujhe (Claude ko) batate hain: "yeh change karo"
2. Main code update karta hoon, test karta hoon, **GitHub pe push** karta hoon, aur aapko **nayi zip** deta hoon
3. Aap StackCP **File Manager** → `public_html`:
   - Purana `assets` folder aur `index.html` **delete**
   - Nayi zip **Upload → Extract → zip delete**
4. Ho gaya — `Ctrl+Shift+R` se site refresh

⚠️ Update ke waqt **`api/config.php`, `api/uploads/`, aur database ko kuch nahi hota** — aapka data hamesha mehfooz rehta hai.

---

## 6. Zaroori addresses (bookmark kar lein)

| Kya | Kahan |
|---|---|
| Website | `https://alnain.pk` |
| Admin panel | `https://alnain.pk/login` |
| Hosting panel | StackCP (NetSoul se) |
| Code | `github.com/Muhammad-shoaib-baloch/alnain-store` |
| Database | StackCP → MySQL Databases (+ phpMyAdmin) |

---

## 7. Security ke asool

1. **Passwords kabhi kisi ko na dein** — na chat mein, na email mein. (Claude bhi kabhi aapka password nahi maangega.)
2. Admin ka password strong rakhein aur kisi aur jagah use na karein
3. Demo customer accounts (sara@example.com waghaira) **disable** kar dein: Admin → Customers → 🚫
4. StackCP/GitHub ke passwords sirf aap ke paas — kisi "support wale" ko bhi na dein

---

## 8. Agar kuch kharab ho jaye

| Masla | Hal |
|---|---|
| Site nahi khul rahi | 5 min ruk kar dobara; phir NetSoul support |
| Products/orders nahi dikh rahe | `alnain.pk/api/` kholein — `"ok":true` aana chahiye; na aaye to `api/config.php` check (DB details) |
| Admin login nahi ho raha | Password theek likha? Warna Claude se rabta — database se reset ho sakta hai |
| Galti se files delete | GitHub se sab wapas aa sakta hai — Claude ko batayen |
| Sab data reset karna ho | Admin → Settings → Danger Zone → Reset (⚠️ sab orders/products wapas demo pe chale jayenge) |

---

## 9. Technical summary (developers ke liye)

- **Frontend:** React 18 + Vite + Tailwind. Source `src/`, build `npm run build` → `dist/`
- **Backend:** Dependency-free PHP 8 API (`api/index.php` router), HMAC tokens, hashed passwords, server-side checkout
- **Database:** MySQL (tables: settings, entities, users, orders, newsletter) — dev pe SQLite bhi chalta hai
- **Local dev:** `npm run dev` + `php -S localhost:8181 -t api api/index.php` (`.env.development.local` → `VITE_API_BASE`)
- **API absent ho to** frontend khud **demo mode** (localStorage seed) pe chala jata hai
- **Deploy:** build + `api/` (minus config) → zip → File Manager upload/extract

---

*Yeh guide GitHub pe bhi save hai (`GUIDE.md`) — kabhi bhi wahan parh sakte hain. Sawal ho to Claude se poochein — kisi bhi hisse ko aur tafseel se samjha dega.*
