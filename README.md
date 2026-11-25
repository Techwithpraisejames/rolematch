# RoleMatch

Find work that fits. RoleMatch is an open-source Next.js project that uses live web retrieval to discover vacancies and an OpenAI model to evaluate the available job evidence against a resume.

## Run locally

Install Node.js 22 or later and npm. Get an API key from [Octen](https://octen.ai/) and [OpenAI](https://platform.openai.com/api-keys).

```bash
git clone https://github.com/Techwithpraisejames/rolematch.git
cd rolematch
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env.local` instead of cp. Before running the server fill in both API keys in .env.local. Never commit this file. Open http://localhost:3000. The sample mode works without API keys. Set OPENAI_MODEL to a Responses API model available in your account; the default is gpt-6.2-sol.

## How it works

1. Extract text from a PDF or DOCX resume (4 MB maximum).
2. OpenAI extracts professional skills and generates up to three targeted queries.
3. Octen retrieves web search results concurrently; source URLs and excerpts are retained.
4. Deduplicate results and evaluate up to 18 excerpts using OpenAI, with Zod validation.
5. Rank individual potential vacancies by matched requirements divided by matched, missing and unknown requirements.

Octen provides the retrieval layer; it is what allows the application to discover jobs outside the model's training data. OpenAI handles extraction and evidence interpretation, not job discovery.

```text
Resume + preferences -> OpenAI profile -> Octen search
 -> deduplication -> OpenAI evaluation -> deterministic ranking -> UI
```

## Limits and privacy

Search excerpts may be stale or incomplete. The app excludes explicit closed listings and non-vacancy pages identified by the model, but does not independently verify that the application page remains open. Scores are indicative evidence coverage, not hiring probability. There is no automated application submission. Resume text is sent to OpenAI with store:false; provider retention policies still apply. Basic contact redaction is not comprehensive. Queries are instructed to omit personal data, but review before using sensitive resumes. No resume database is used.

Local usage is limited to three attempts per day per process and a configurable global cap (defaults to 30). Local counters reset on restart. Hosted use requires Upstash Redis REST credentials for atomic shared daily counters; the application fails closed without them. The sample mode never calls paid APIs.

## Deploy to Vercel

Import this repository as a Next.js project. For a public showcase use LIVE_SEARCH_ENABLED=false; sample mode remains available. For controlled live testing set LIVE_SEARCH_ENABLED=true and HOSTED_DEMO=true, configure both API keys and UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN, and set DAILY_GLOBAL_LIMIT. Add Vercel firewall or bot protection before exposing paid live search publicly. Provider budgets and alerts are recommended. The route caps execution at 120 seconds where supported; platform upload limits are the reason for the 4 MB file cap.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

Live integration requires valid credentials. Use a non-sensitive sample resume to test retrieval, match accuracy and mobile layout before publishing.

## License

MIT if included in the repository; see LICENSE.
