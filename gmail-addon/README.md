# Aurum Gmail Add-on

Parses BAC San José and Banco Nacional transaction emails and registers them directly in Aurum.

## Setup

### 1. Generate an API token in Aurum

1. Open the Aurum app → **Settings** → **Gmail Add-on Tokens**
2. Click **New Token**, give it a name (e.g. "Gmail Add-on"), click **Create**
3. Copy the token — it is shown only once

### 2. Deploy the add-on

Install `clasp` (Google's Apps Script CLI):

```bash
npm install -g @google/clasp
clasp login
```

Create a new Apps Script project and push:

```bash
cd gmail-addon
clasp create --type gmail-addon --title "Aurum Expense Tracker"
clasp push
```

Or copy the four files (`Code.gs`, `Config.gs`, `Parser.gs`, `appsscript.json`) manually into a new project at [script.google.com](https://script.google.com).

### 3. Configure the add-on

1. In the Apps Script editor, go to **Deploy → Test deployments → Install**
2. Open Gmail and click the Aurum icon (🪙) in the right sidebar
3. A settings card will appear on first open — enter your Aurum URL and the token from step 1, click **Save**

### 4. Use it

Open any transaction email from BAC or Banco Nacional. The sidebar shows pre-filled fields:

| Field | Source |
|---|---|
| Type | Detected from email (Compra → expense) |
| Description | Merchant name |
| Amount | Transaction amount |
| Currency | CRC or USD |
| Date | Transaction date |
| Notes | Empty — fill manually |

Click **Register in Aurum** — the expense appears in your Aurum dashboard instantly.

## Supported banks

| Bank | Detection |
|---|---|
| BAC San José | `@baccredomatic.cr` sender |
| Banco Nacional | `@bncr.fi.cr` sender |

## Publishing (optional)

To publish for other users: in the Apps Script editor go to **Deploy → New deployment**, select **Add-on**, and follow the Google Workspace Marketplace publishing flow.
