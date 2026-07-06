# Jenkins CI/CD for KisanConnect

## 1. Install Jenkins plugins
Install these plugins in Jenkins:
- Pipeline
- Docker Pipeline
- Kubernetes CLI
- Git
- Workspace Cleanup

## 2. Create a Pipeline job
- New Item -> Pipeline
- Choose GitHub project or Pipeline script from SCM
- Repository URL: your repo URL
- Script Path: Jenkinsfile

## 3. Configure credentials
Create Jenkins credentials for:
- kubeconfig (Secret file) or a Kubernetes service account token
- Docker registry credentials if you push images to a registry

## 4. Environment variables
Set these as Jenkins job parameters or global environment variables:
- K8S_NAMESPACE=default
- IMAGE_REPOSITORY=your-registry.example.com

## 5. Example Jenkins pipeline usage
- Run with SERVICE=all and DEPLOY=false for test/build only
- Run with SERVICE=user-service and DEPLOY=true to deploy that service to Kubernetes

## 6. Kubernetes deployment note
The repo already contains manifests under k8s-manifests. For Jenkins deployment, the pipeline updates the matching deployment image directly with:

```bash
kubectl set image deployment/<deployment> <container>=<image> -n <namespace>
```

## 7. Registry push and deployment controls
The Jenkins pipeline now supports:
- `PUSH_IMAGE=true` to push built images to a registry
- `REGISTRY_CREDENTIALS_ID` for a Jenkins username/password credential
- `REGISTRY_URL` such as `docker.io` or `ghcr.io`
- `DEPLOY_BRANCH=main` to restrict deployment to a specific branch, or `all` for any branch
- `SLACK_WEBHOOK_URL` for optional build notifications

Example values:
- `REGISTRY_URL=docker.io`
- `IMAGE_REPOSITORY=myusername`
- `DEPLOY_BRANCH=main`
