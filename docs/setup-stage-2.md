# Stage 2 — Setup Session

Complete these steps during the setup session with your instructor. You will need your IBM i credentials (provided by your instructor) and your laptop with Bob installed.

---

## 0.3 — Choose Your Server, IP Address and Library Number

Your instructor will assign you a library number. Each participant has their own copy of the FLIGHT400 application in a library named **FLGHT4nn** (e.g. FLGHT401, FLGHT402). Use only your assigned number throughout all exercises so everyone can work independently.

> ⚠️ The library name is `FLGHT4nn` — note there is **no "I"** in FLGHT. Always type `FLGHT4nn` (F‑L‑G‑H‑T), not FLIGHT4nn.

| Student # | Library | Dev Port | React App URL |
|:---------:|---------|:--------:|---------------|
| 1  | `FLGHT401` | 3001 | `http://localhost:3001` |
| 2  | `FLGHT402` | 3002 | `http://localhost:3002` |
| 3  | `FLGHT403` | 3003 | `http://localhost:3003` |
| 4  | `FLGHT404` | 3004 | `http://localhost:3004` |
| 5  | `FLGHT405` | 3005 | `http://localhost:3005` |
| 6  | `FLGHT406` | 3006 | `http://localhost:3006` |
| 7  | `FLGHT407` | 3007 | `http://localhost:3007` |
| 8  | `FLGHT408` | 3008 | `http://localhost:3008` |
| 9  | `FLGHT409` | 3009 | `http://localhost:3009` |
| 10 | `FLGHT410` | 3010 | `http://localhost:3010` |

> 💡 The **Dev Port** is only needed for Exercise 3.

---

## 0.4 — Connect Bob IDE to IBM i

**Step 1 — Add a new connection**
Click the IBM i icon in the Activity Bar, then click **New Connection**. Enter the host IP `<myIPaddress>`, the user profile `ITZUSER`, and the `ssh_private_key.pem` private key file from the folder shared by your instructor. When prompted for the private key, browse to the saved `ssh_private_key.pem` file. **Do not use the password here — use only the private key file.**

![IBM i icon in the Bob Activity Bar](img/ibmi_icon.png)

![IBM i connection dialog in Bob IDE](img/i-connection.png)

**Step 2 — Add your assigned library to the User Library List**
In the Code for IBM i extension, navigate to **User Library List** and click the **+** icon. Type `FLGHT4nn` (replace `nn` with your assigned number) and press **Enter**.

![User Library List section in the Code for IBM i extension](img/add-library.png)

![Input field prompting for library name](img/add-library-name.png)

**Step 3 — Add your assigned library to the Object Browser**
Go to the **Object Browser** section and click the funnel icon or **Create new filter**. Set **Libraries** to `FLGHT4nn` and **Object types** to `*ALL`. Click **Save Settings**.

> ⚠️ Use `*ALL`, not `*` — the wildcard `*` does not work for filtering object types.

![Object Browser section showing the funnel/Create new filter button](img/add-object-filter.png)

![Object Browser filter fields with Object types set to *ALL](img/objectfilter.jpeg)

**Step 4 — Set the workspace to Library List**
Click the **+** icon above the Bob chat window. Select **New Task in Library List** and confirm your `FLGHT4nn` library is listed.

![Bob scope picker showing New Task in Library List option](img/set-workspace.png)

![Library List scope selected in the Bob chat](img/librarylist.png)

---

## 0.5 — Set Private Key Permissions

Save the private key file from the folder your instructor shared with you and set its permissions so OpenSSH will accept it. You need it to connect Bob to IBM i in 0.4 and to open the SSH tunnel in Exercise 3.

**Step 1 — Save your private key and set its permissions**

macOS / Linux:
```bash
chmod 600 ssh_private_key.pem
```

Windows (PowerShell, run as Administrator):
```powershell
icacls ssh_private_key.pem /inheritance:r /grant:r "$($env:USERNAME):R"
```

> 💡 The SSH tunnel is now in **Exercise 3** (step 3.1).
