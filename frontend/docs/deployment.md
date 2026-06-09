# Resume Builder Deployment Plan

## 1. Prerequisites
- A GitHub account.
- A Vercel account (linked to your GitHub).
- Your Groq API key (which you currently have in `.env.local`).

## 2. Push Code to GitHub
The project is already initialized with Git and committed locally. Follow these steps to push your code:

1. Go to GitHub and create a new, empty repository (do not add a README or .gitignore).
2. Run the following commands in your terminal to link and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

## 3. Deploy to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Find the GitHub repository you just created and click **Import**.
4. In the **Configure Project** section:
   - **Framework Preset**: Vercel will automatically detect **Next.js**.
   - **Root Directory**: Leave as `./`
   - **Environment Variables**: Expand this section and add your Groq API key:
     - **Name**: `GROQ_API_KEY`
     - **Value**: *(Paste your actual API key here)*
5. Click **Deploy**. Vercel will build and launch your application.

## 4. Architectural Notes for Deployment
- **API Timeouts Handled**: Vercel's free tier (Hobby) limits serverless function execution to 10 seconds by default. We have explicitly added `export const maxDuration = 30;` to the parsing and scoring routes, and `60` to the tailor route to accommodate longer Groq LLM generations.
- **PDF Parsing**: We replaced the legacy `pdf-parse` library with `pdfjs-dist` to ensure seamless compatibility with Next.js Turbopack and Vercel's Serverless environment.
- **Next.js Config**: We added `pdfjs-dist` to `serverExternalPackages` in `next.config.ts` to prevent bundling errors during the production build.

## 5. Post-Deployment Checks
- Once the deployment finishes, click the domain Vercel provides (e.g., `resume-shapeshifter.vercel.app`).
- Upload a PDF or load the sample text to ensure the file uploads properly.
- Run a full "Analyze Match" and "Generate Tailored Resume" cycle to confirm the Groq API key is successfully injected into the Vercel environment.
