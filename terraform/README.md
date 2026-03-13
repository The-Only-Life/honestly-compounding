# Terraform Configuration for Google Cloud Run

This directory contains Terraform configurations to deploy the honestly-insight-hub monorepo to Google Cloud Run.

## Prerequisites

1. **Install Terraform**: Download from [terraform.io](https://www.terraform.io/downloads.html)
2. **Install gcloud CLI**: [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. **GCP Project**: You need a Google Cloud Project with billing enabled
4. **Docker**: For building and pushing images

## Setup

### 1. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 2. Configure Variables

Copy the example variables file and fill in your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your:
- GCP project ID
- Preferred region
- Environment variables
- Resource limits

### 3. Initialize Terraform

```bash
cd terraform
terraform init
```

## Deployment

### Option A: Deploy Infrastructure + Build & Push Image Manually

#### Step 1: Deploy Infrastructure

```bash
terraform plan
terraform apply
```

#### Step 2: Build and Push Docker Image

```bash
# Get the artifact registry URL from terraform output
REGION=$(terraform output -raw region 2>/dev/null || echo "us-central1")
PROJECT_ID=$(terraform output -raw project_id 2>/dev/null || grep 'project_id' terraform.tfvars | cut -d'"' -f2)
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/honestly-insight-hub-repo/honestly-insight-hub:latest"

# Configure Docker to authenticate with Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build the image from the project root
cd ..
docker build -t ${IMAGE_URL} .

# Push to Artifact Registry
docker push ${IMAGE_URL}

# Deploy the new image to Cloud Run
gcloud run services update honestly-insight-hub \
  --image ${IMAGE_URL} \
  --region ${REGION}
```

### Option B: Use Cloud Build (Recommended)

Build the image directly on GCP using Cloud Build:

```bash
# From the project root directory
cd ..

# Submit build to Cloud Build
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/honestly-insight-hub-repo/honestly-insight-hub:latest

# The Cloud Run service will automatically use the new image
cd terraform
terraform apply -auto-approve
```

## Continuous Deployment

For automated deployments, you can:

1. **Use Cloud Build Triggers**: Set up a trigger in GCP Console to automatically build and deploy on git push
2. **GitHub Actions**: Create a workflow that builds and deploys on push to main

### Example GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Build and Push
        run: |
          gcloud builds submit \
            --tag us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/honestly-insight-hub-repo/honestly-insight-hub:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run services update honestly-insight-hub \
            --image us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/honestly-insight-hub-repo/honestly-insight-hub:latest \
            --region us-central1
```

## Managing Secrets

For sensitive environment variables (database URLs, API keys):

1. **Use Secret Manager**:

```bash
echo -n "your-secret-value" | gcloud secrets create my-secret --data-file=-
```

2. **Update main.tf** to reference secrets:

```hcl
env {
  name = "DATABASE_URL"
  value_source {
    secret_key_ref {
      secret  = "database-url"
      version = "latest"
    }
  }
}
```

## Useful Commands

```bash
# View deployment status
terraform show

# View outputs
terraform output

# Update service
terraform apply

# Destroy all resources
terraform destroy

# View Cloud Run logs
gcloud run services logs read honestly-insight-hub --region us-central1

# Access the service
curl $(terraform output -raw service_url)
```

## Cost Optimization

- Set `min_instances = 0` to scale to zero when not in use
- Adjust `cpu_limit` and `memory_limit` based on actual usage
- Monitor usage in GCP Console and adjust `max_instances`

## Troubleshooting

1. **Image not found**: Ensure you've built and pushed the Docker image
2. **Permission errors**: Check IAM roles and API enablement
3. **Health check failing**: Verify `/health` endpoint returns 200
4. **Container crashes**: Check logs with `gcloud run services logs read`

## Architecture

The deployment uses:
- **Nginx** (port 8080): Serves static frontend and proxies API requests
- **Bun Server** (port 3001): Handles backend API requests
- **Single Container**: Both apps run in one container for simplicity
