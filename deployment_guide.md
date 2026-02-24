# Deployment Guide — "The Pouch"

This guide outlines how to take "The Pouch" from your local machine to a live, production environment.

---

## 🏗️ Architecture
- **Frontend**: React (Vite) → Hosted on **Vercel** or **Netlify**.
- **Backend**: Flask (Python) → Hosted on **Google Cloud Run**.
- **Database**: **Google BigQuery** (Already cloud-resident).

---

## ☁️ Cloud Readiness Check (Verified)
- ✅ `gunicorn` is included in `backend/requirements.txt`.
- ✅ `backend/app.py` and `gunicorn.conf.py` use the dynamic `$PORT` variable.
- ✅ Dockerfile is configured for Cloud Run.

---

## 1. Backend: Google Cloud Run
Deploy the Flask API to your `bill-sandpit` project.

### Step-by-Step (PowerShell Friendly)
Run these commands from the `backend/` directory:

1. **Authenticate & Set Project**:
```powershell
gcloud auth login
gcloud config set project bill-sandpit
```

2. **Deploy to Cloud Run**:
> [!IMPORTANT]
> Copy the **entire** command below and paste it as one block.
```powershell
gcloud run deploy the-pouch-api `
  --source . `
  --region australia-southeast1 `
  --allow-unauthenticated `
  --set-env-vars "FLASK_ENV=production,GOOGLE_CLOUD_PROJECT=bill-sandpit,BQ_DATASET=nmfc_performance_hub"
```
*Note: The backtick (`) is the line-continuation character in PowerShell.*

3. **Save the Service URL**:
Google will provide a URL like `https://the-pouch-api-xyz.a.run.app`. **Save this for the next step.**

---

## 2. Frontend: Static Hosting (Vercel)
Vercel is the best fit for Vite applications.

1. Create an account on [Vercel](https://vercel.com).
2. Connect your repository.
3. **Environment Variable**: Add `VITE_API_URL` under Settings → Environment Variables.
   - Value: `https://the-pouch-api-xyz.a.run.app/api` (The URL from Step 1 + `/api`).
4. **Deploy**: Vercel will build and deploy automatically using `npm run build`.

---

## 3. Database Permissions
For the live app to access BigQuery:
1. Go to **IAM & Admin** in Google Cloud Console.
2. Find the Service Account for your Cloud Run service (`the-pouch-api`).
3. Grant it:
   - **BigQuery Data Editor**
   - **BigQuery User**

---

## 4. CORS Updates
1. Open `backend/config.py`.
2. Add your Vercel URL to `ProductionConfig.CORS_ORIGINS`.
3. Re-run the deploy command from Step 1.
