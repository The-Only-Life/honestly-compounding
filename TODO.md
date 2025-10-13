# Deployment TODO

## Google Cloud Setup with Separate Account

### 1. Create gcloud Configuration for Project-Specific Account

- [ ] Create a new gcloud configuration for this project:
  ```bash
  gcloud config configurations create honestly-insight-hub
  ```

- [ ] Activate the new configuration:
  ```bash
  gcloud config configurations activate honestly-insight-hub
  ```

- [ ] Login with your **project-specific** Google account (NOT your main account):
  ```bash
  gcloud auth login
  ```
  This will open a browser - use your secondary account, not your main one.

- [ ] Set up application default credentials for Terraform:
  ```bash
  gcloud auth application-default login
  ```

- [ ] Set the GCP project ID:
  ```bash
  gcloud config set project YOUR_PROJECT_ID
  ```

- [ ] Set the default region (Mumbai, India):
  ```bash
  gcloud config set compute/region asia-south1
  ```

- [ ] Configure Docker authentication for Artifact Registry:
  ```bash
  gcloud auth configure-docker asia-south1-docker.pkg.dev
  ```

### 2. Terraform Setup

- [ ] Navigate to terraform directory:
  ```bash
  cd terraform
  ```

- [ ] Copy the example variables file:
  ```bash
  cp terraform.tfvars.example terraform.tfvars
  ```

- [ ] Edit `terraform.tfvars` with your values:
  - Add your GCP project ID
  - Configure environment variables (DATABASE_URL, SUPABASE_URL, etc.)
  - Adjust resource limits if needed

- [ ] Initialize Terraform:
  ```bash
  terraform init
  ```

- [ ] Review the deployment plan:
  ```bash
  terraform plan
  ```

- [ ] Deploy the infrastructure:
  ```bash
  terraform apply
  ```

### 3. Build and Deploy Docker Image

- [ ] Navigate back to project root:
  ```bash
  cd ..
  ```

- [ ] Build and push image using Cloud Build:
  ```bash
  gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/honestly-insight-hub-repo/honestly-insight-hub:latest
  ```

- [ ] Verify deployment:
  ```bash
  cd terraform
  terraform output service_url
  ```

- [ ] Test the deployed application:
  ```bash
  curl $(terraform output -raw service_url)/health
  ```

### 4. Managing Multiple Google Accounts

**Switch to project account:**
```bash
gcloud config configurations activate honestly-insight-hub
```

**Switch back to main account:**
```bash
gcloud config configurations activate default
```

**Check which account is active:**
```bash
gcloud config configurations list
gcloud auth list
```

**See current project:**
```bash
gcloud config get-value project
```

---

## Notes

- Always ensure `honestly-insight-hub` configuration is active before running Terraform or gcloud commands for this project
- Your main Google account remains untouched in the `default` configuration
- Service account credentials (if created) should be added to `.gitignore`
- For production, consider using Secret Manager for sensitive environment variables
