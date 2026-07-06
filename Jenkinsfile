pipeline {
  agent any

  parameters {
    choice(
      name: 'SERVICE',
      choices: ['all', 'user-service', 'product-service', 'order-service', 'notification-service', 'frontend'],
      description: 'Which service should be tested and built?'
    )
    booleanParam(
      name: 'DEPLOY',
      defaultValue: false,
      description: 'Deploy the built image to Kubernetes when enabled'
    )
    booleanParam(
      name: 'PUSH_IMAGE',
      defaultValue: false,
      description: 'Push the built image to a container registry'
    )
    string(
      name: 'REGISTRY_CREDENTIALS_ID',
      defaultValue: '',
      description: 'Jenkins credential ID for registry username/password'
    )
    string(
      name: 'REGISTRY_URL',
      defaultValue: '',
      description: 'Registry host, for example docker.io or ghcr.io'
    )
    string(
      name: 'DEPLOY_BRANCH',
      defaultValue: 'main',
      description: 'Branch that can deploy. Use all to deploy on any branch.'
    )
    string(
      name: 'SLACK_WEBHOOK_URL',
      defaultValue: '',
      description: 'Optional Slack webhook for build notifications'
    )
  }

  environment {
    K8S_NAMESPACE = "${env.K8S_NAMESPACE ?: 'default'}"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    IMAGE_REPOSITORY = "${env.IMAGE_REPOSITORY ?: ''}"
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          sh 'git --version'
          sh 'java -version'
          sh 'mvn -version || true'
          sh 'node -v || true'
          sh 'docker --version || true'
          sh 'kubectl version --client --short || true'
        }
      }
    }

    stage('Build and Test') {
      steps {
        script {
          def services = []

          if (params.SERVICE == 'all' || params.SERVICE == 'user-service') {
            services.add([name: 'user-service', dir: 'backend/user-service', buildType: 'maven', deployment: 'kc-user-service', container: 'user-service', image: 'kisanconnect/user-service'])
          }
          if (params.SERVICE == 'all' || params.SERVICE == 'product-service') {
            services.add([name: 'product-service', dir: 'backend/product-service', buildType: 'maven', deployment: 'kc-product-service', container: 'product-service', image: 'kisanconnect/product-service'])
          }
          if (params.SERVICE == 'all' || params.SERVICE == 'order-service') {
            services.add([name: 'order-service', dir: 'backend/order-service', buildType: 'maven', deployment: 'kc-order-service', container: 'order-service', image: 'kisanconnect/order-service'])
          }
          if (params.SERVICE == 'all' || params.SERVICE == 'notification-service') {
            services.add([name: 'notification-service', dir: 'backend/notification-service', buildType: 'maven', deployment: 'kc-notification-service', container: 'notification-service', image: 'kisanconnect/notification-service'])
          }
          if (params.SERVICE == 'all' || params.SERVICE == 'payment-service') {
            services.add([name: 'payment-service', dir: 'backend/payment-service', buildType: 'maven', deployment: 'kc-payment-service', container: 'payment-service', image: 'kisanconnect/payment-service'])
          }
          if (params.SERVICE == 'all' || params.SERVICE == 'frontend') {
            services.add([name: 'frontend', dir: 'frontend', buildType: 'node', deployment: 'kc-frontend', container: 'frontend', image: 'kisanconnect/frontend'])
          }

          for (service in services) {
            buildService(service)
          }
        }
      }
    }
  }

  post {
    success {
      script {
        notifyBuild('SUCCESS')
      }
    }
    failure {
      script {
        notifyBuild('FAILED')
      }
    }
  }
}

def buildService(Map svc) {
  echo "Building ${svc.name}"

  dir(svc.dir) {
    if (svc.buildType == 'maven') {
      sh 'chmod +x mvnw'
      sh './mvnw test -Dspring.profiles.active=test --no-transfer-progress'
      sh './mvnw package -DskipTests --no-transfer-progress'
    } else {
      sh 'npm ci'
      sh 'npm run build'
    }

    def imageName = svc.image
    def repoPrefix = env.IMAGE_REPOSITORY?.trim()
    if (repoPrefix) {
      imageName = "${repoPrefix}/${svc.image}"
    }
    if (params.REGISTRY_URL?.trim()) {
      imageName = "${params.REGISTRY_URL.trim()}/${imageName}"
    }

    def fullImage = "${imageName}:${env.IMAGE_TAG}"
    def latestImage = "${imageName}:latest"
    sh "docker build -t ${fullImage} -t ${latestImage} -f Dockerfile ."

    if (params.PUSH_IMAGE) {
      if (params.REGISTRY_CREDENTIALS_ID?.trim()) {
        withCredentials([usernamePassword(credentialsId: params.REGISTRY_CREDENTIALS_ID, usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASS')]) {
          def registryHost = params.REGISTRY_URL?.trim()
          if (registryHost) {
            sh "echo \$REGISTRY_PASS | docker login ${registryHost} -u \$REGISTRY_USER --password-stdin"
          } else {
            sh "echo \$REGISTRY_PASS | docker login -u \$REGISTRY_USER --password-stdin"
          }
          sh "docker push ${fullImage}"
          sh "docker push ${latestImage}"
        }
      } else {
        echo 'Registry credentials were not provided, so the image was not pushed.'
      }
    }

    if (shouldDeploy() && params.DEPLOY) {
      sh "kubectl set image deployment/${svc.deployment} ${svc.container}=${fullImage} -n ${env.K8S_NAMESPACE} --record"
      sh "kubectl rollout status deployment/${svc.deployment} -n ${env.K8S_NAMESPACE}"
    }
  }
}

def shouldDeploy() {
  def branch = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').toString().replaceFirst('^origin/', '')
  if (params.DEPLOY_BRANCH == 'all') {
    return true
  }
  return branch == params.DEPLOY_BRANCH
}

def notifyBuild(String status) {
  def branch = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown').toString().replaceFirst('^origin/', '')
  def message = "Jenkins ${status}: ${env.JOB_NAME} #${env.BUILD_NUMBER} on branch ${branch}"
  if (params.SLACK_WEBHOOK_URL?.trim()) {
    sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"${message}\"}' '${params.SLACK_WEBHOOK_URL.trim()}'"
  } else {
    echo message
  }
}
