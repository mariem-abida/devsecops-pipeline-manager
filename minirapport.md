# MINIRAPPORT TECHNIQUE — DevSecOps Pipeline Manager
## Dossier de contexte pour la rédaction du rapport de stage académique (2 mois, été 2026)

---

## 1. CONTEXTE GÉNÉRAL DU STAGE

Ce stage s'est déroulé dans le cadre d'un stage d'été de 2 mois (juillet–août 2026).
L'objectif principal était de **concevoir, développer et déployer une plateforme DevSecOps complète**, de bout en bout, intégrant l'intelligence artificielle pour l'analyse de sécurité.

Le projet est hébergé sur deux dépôts Git :
- **GitLab public** : https://gitlab.com/devsecops-pipeline-manager (dépôts séparés par composant)
- **GitLab entreprise** : http://192.168.111.210/DevSecOps/DevSecOps.git (monorepo entreprise)

---

## 2. PROBLÉMATIQUE ET BESOIN

### 2.1 Contexte industriel
Dans les équipes de développement modernes, la sécurité des applications est souvent traitée **en fin de cycle** (test, avant mise en production), ce qui rend les corrections coûteuses et tardives. L'approche **DevSecOps** vise à intégrer la sécurité **dès le début et à chaque étape** du cycle de développement logiciel (shift-left security).

### 2.2 Problème identifié
Il n'existait pas d'outil unifié permettant de :
- **Déclencher** un pipeline de sécurité complet depuis une interface graphique
- **Centraliser** tous les résultats (tests, qualité, SAST, vulnérabilités, SBOM, IA)
- **Automatiser** les décisions de déploiement selon des politiques de sécurité
- **Intégrer l'intelligence artificielle** pour interpréter les rapports et proposer des recommandations concrètes

### 2.3 Objectifs du projet
1. Construire une plateforme web qui orchestre un pipeline CI/CD sécurisé complet via Jenkins
2. Intégrer des outils de sécurité réels (Semgrep, Trivy, Gitleaks, SonarQube, Cosign, OPA)
3. Ajouter un module IA (Google Gemini) pour l'analyse et les recommandations de sécurité
4. Persister les données de pipeline dans PostgreSQL et les exposer via une API REST (FastAPI)
5. Créer un tableau de bord frontend moderne (Next.js) pour visualiser en temps réel l'état des pipelines

---

## 3. ARCHITECTURE GLOBALE DU SYSTÈME

### 3.1 Vue d'ensemble

`
UTILISATEUR (Navigateur Web)
         |  HTTP
         v
FRONTEND — Next.js 15 (TypeScript + TailwindCSS)
  Pages : Dashboard | Run Pipeline | Pipeline Monitor | Security Results
          Code Quality | AI Recommendations | SBOM | Test Results
          Compliance | Projects | Settings
  Port : 3000
         |  REST API (HTTP JSON)
         v
BACKEND — FastAPI (Python 3.12)
  Routes : /projects /pipelines /reports /recommendations /health
  ORM : SQLAlchemy + psycopg3
  Port : 8000
    |                       |
    v                       v
PostgreSQL (port 5433)    Jenkins (port 8080)
Tables :                  Pipeline déclenché via API REST
- projects                Accès aux artefacts de build
- pipelines                        |
- test_results                     v
- quality_results         JENKINS PIPELINE (Jenkinsfile)
- security_results        20+ étapes DevSecOps
- deployment_results
- ai_results
`

### 3.2 Dépôts Git du projet

| Dossier | Type | Rôle |
|---|---|---|
| backend-platform/ | Dépôt Git indépendant | API FastAPI + ORM + services |
| frontend-platform/ | Dépôt Git indépendant | Interface Next.js (SSR) |
| ai-advisor/ | Dépôt Git indépendant | Script IA Gemini |
| jenkins-pipeline/ | Dépôt Git indépendant | Jenkinsfile + OPA + Cosign |
| jenkins-platform/ | Dossier (monorepo) | Dockerfile Jenkins custom |
| database/ | Dossier (monorepo) | Dump SQL PostgreSQL |
| sonarqube-platform/ | Dossier (monorepo) | Docker Compose SonarQube |
| sample-python-app/ | Dépôt Git indépendant | Application cible du pipeline |

---

## 4. DESCRIPTION DÉTAILLÉE DES COMPOSANTS

### 4.1 Backend — FastAPI (Python)

**Chemin :** backend-platform/
**Technologie :** Python 3.12, FastAPI, SQLAlchemy, psycopg3, PostgreSQL

**Rôle :** Serveur API REST intermédiaire entre le frontend et Jenkins/PostgreSQL.

**Routes exposées :**

| Endpoint | Méthode | Description |
|---|---|---|
| /projects | GET, POST, DELETE | Gestion des projets GitLab enregistrés |
| /pipelines | GET, POST | Déclencher et suivre un pipeline Jenkins |
| /pipelines/{build} | GET | Statut en temps réel d'un build Jenkins |
| /reports/{build}/tests | GET | Résultats JUnit des tests unitaires |
| /reports/{build}/quality | GET | Résultats SonarQube / analyse qualité |
| /reports/{build}/security | GET | Résultats SAST + secrets + dépendances |
| /reports/{build}/deployment | GET | Décision de déploiement OPA |
| /reports/{build}/ai | GET | Rapport JSON Gemini (recommandations IA) |
| /reports/{build}/sbom | GET | SBOM CycloneDX (inventaire composants) |
| /reports/{build}/compliance | GET | Vérification conformité OPA |
| /health | GET | Vérification santé backend + BDD |

**Services clés :**
- jenkins_service.py : Authentification Jenkins (HTTP Basic Auth), déclenchement de builds via l'API REST Jenkins, polling du statut build, récupération des artefacts
- report_service.py : Parsing des rapports Jenkins (XML JUnit, JSON, TXT) en objets Pydantic structurés
- db.py : Connexion SQLAlchemy + initialisation des tables au démarrage

**Modèles de base de données (SQLAlchemy) :**
- ProjectModel : Projets GitLab enregistrés (URL, branche, langage, visibilité)
- PipelineModel : Exécutions Jenkins (build number, statut, progression, options)
- TestResultModel : Résultats des tests (total, passés, échoués, ignorés)
- QualityResultModel : Résultats qualité (statut, nombre de bugs)
- SecurityResultModel : Résultats de sécurité (statut, nombre de vulnérabilités)
- DeploymentResultModel : Décision de déploiement (OPA allow/deny)
- AIResultModel : Rapport IA Gemini (statut, modèle utilisé, rapport JSON complet)

**Dépendances Python :**
fastapi, uvicorn, pydantic, python-dotenv, requests, sqlalchemy, psycopg[binary]

---

### 4.2 Frontend — Next.js (TypeScript)

**Chemin :** frontend-platform/
**Technologie :** Next.js 15.5.18, TypeScript 5, TailwindCSS 3.4.17, shadcn/ui (Radix UI), Recharts 2.15.4, Lucide Icons

**Pages de l'application :**

| Page | Route | Rôle |
|---|---|---|
| Dashboard | / | Vue d'ensemble : statistiques globales, derniers builds |
| Run Pipeline | /run-pipeline | Formulaire de déclenchement d'un pipeline |
| Pipeline Monitor | /pipeline-monitor | Suivi temps réel (logs Jenkins toutes les 2,5s) |
| Security Results | /security-results | SAST, secrets détectés, vulnérabilités dépendances |
| Code Quality | /code-quality | Métriques SonarQube (bugs, smells, couverture) |
| AI Recommendations | /ai-recommendations | Rapport Gemini et décision de déploiement IA |
| SBOM | /sbom | Inventaire des composants logiciels |
| Test Results | /test-results | Résultats JUnit avec graphiques |
| Compliance | /compliance | Vérification conformité OPA |
| Projects | /projects | Gestion des projets GitLab |
| Settings | /settings | Configuration Jenkins, GitLab, SonarQube, IA |

**Choix techniques importants :**
- Polling automatique toutes les 2,5 secondes dans Pipeline Monitor pour les mises à jour temps réel
- Composants UI basés sur Radix UI (accessibilité) et shadcn/ui (theming)
- Graphiques avec Recharts (camembert tests, barres vulnérabilités)
- Notifications toast avec Sonner
- Service API centralisé dans services/api.ts

---

### 4.3 AI Security Advisor (Module IA)

**Chemin :** ai-advisor/ai_security_advisor.py
**Technologie :** Python 3, Google Gemini API (google-genai), JSON Schema strict

**Rôle :** Script Python standalone exécuté comme étape du pipeline Jenkins (stage "AI Security Advisor"). Il lit les rapports des étapes précédentes et demande à Google Gemini d'analyser les résultats pour produire des recommandations structurées.

**Fonctionnement :**
1. Lecture des rapports de sécurité produits par les étapes précédentes :
   - reports/sast-report.json (Semgrep)
   - reports/dependency-report.json (pip-audit / npm audit)
   - reports/container-scan-report.json (Trivy)
   - reports/sbom.cdx.json (Syft)
2. Résumé statistique de chaque rapport (comptage des vulnérabilités par sévérité)
3. Construction d'un prompt structuré contenant toutes les métriques
4. Appel à l'API Google Gemini avec un JSON Schema strict pour garantir une réponse parsable
5. Validation du JSON reçu contre le schéma
6. Écriture du rapport dans reports/ai-security-report.json

**Structure du rapport IA produit :**
`json
{
  "total_recommendations": 3,
  "critical_count": 0,
  "high_count": 2,
  "medium_count": 1,
  "low_count": 0,
  "recommendations": [
    {
      "id": 1,
      "priority": "High",
      "category": "Dependency Security",
      "problem": "...",
      "explanation": "...",
      "suggestion": "...",
      "relatedTool": "Trivy",
      "deploymentImpact": "Blocks deployment"
    }
  ],
  "action_steps": [...],
  "deployment_assistant": {
    "decision": "Deployment Blocked",
    "deployment_blocked": true,
    "main_reason": "...",
    "requirements": [...],
    "next_action": "..."
  },
  "context": {
    "project": "sample-python-app",
    "branch": "main",
    "build_number": "#138",
    "ai_mode": "Security Report Interpretation",
    "actual_model": "gemini-3.7-flash",
    "generated_at": "2026-09-03 13:48 UTC"
  }
}
`

---

### 4.4 Jenkins Pipeline (Jenkinsfile)

**Chemin :** jenkins-pipeline/Jenkinsfile
**Technologie :** Groovy DSL, Jenkins declarative pipeline

**Configuration Jenkins personnalisée (jenkins-platform/Dockerfile) :**
L'image Docker Jenkins est enrichie avec les outils suivants :
- Docker CLI + Docker Compose v5.5.0
- Semgrep 1.175.0 (SAST — analyse statique de sécurité)
- Trivy 0.74.0 (scan de vulnérabilités des images Docker)
- Syft 1.51.1 (génération SBOM — CycloneDX et SPDX)
- Cosign 3.1.3 (signature et vérification cryptographique des images)
- OPA 1.19.1 (Open Policy Agent — Policy as Code)
- Gitleaks 8.21.2 (détection de secrets dans le code)
- Python3 + pip3, Node.js, npm, Git

**Stages du Pipeline (dans l'ordre d'exécution) :**

| # | Etape | Outil | Description |
|---|---|---|---|
| 1 | Validate Parameters | Jenkins | Validation paramètres (URL GitLab, branche, env) |
| 2 | Checkout | Git | Clone du dépôt GitLab via credential Jenkins |
| 3 | Detect Language | Fichiers | Détection automatique du langage (Python/JS/Java) |
| 4 | Build | pip/npm/mvn | Installation des dépendances du projet |
| 5 | Unit Tests | pytest/Jest/Maven | Exécution tests unitaires → XML JUnit |
| 6 | Code Quality | pylint/ESLint | Analyse qualité du code → rapport TXT |
| 7 | SonarQube Analysis | SonarQube Scanner | Analyse code (bugs, smells, coverage) |
| 7b | SonarQube Quality Gate | SonarQube API | Vérification du Quality Gate (PASS/FAIL) |
| 8 | SAST | Semgrep | Analyse statique de sécurité → JSON |
| 9 | Dependency Audit | pip-audit/npm audit | Audit des dépendances → JSON |
| 10 | Secret Detection | Gitleaks | Détection de secrets/tokens → JSON |
| 11 | Docker Build | Docker | Construction de l'image Docker |
| 12 | Container Scan | Trivy | Scan image Docker pour vulnérabilités CVE → JSON |
| 13 | SBOM | Syft | Génération Software Bill of Materials → CycloneDX JSON |
| 14 | AI Security Advisor | Google Gemini | Analyse IA des rapports → recommandations JSON |
| 15 | Policy as Code | OPA (Rego) | Évaluation des politiques → allow/deny |
| 16 | Deployment Decision | OPA result | Décision finale APPROVED/REJECTED |
| 17 | Publish Image | GitLab Registry | Push de l'image Docker dans le registre GitLab |
| 18 | Resolve Digest | Docker | Récupération du SHA256 digest |
| 19 | Sign Image | Cosign | Signature cryptographique (clé privée) |
| 20 | Verify Signature | Cosign | Vérification de la signature (clé publique) |
| 21 | Production Approval | Jenkins Input | Approbation manuelle optionnelle |
| 22 | Deploy | Docker Compose | Déploiement de l'application |
| 23 | Audit | Logs | Résumé d'audit complet du build |
| 24 | Summary | Jenkins | Rapport final coloré dans la console |

**Paramètres du pipeline :**
- GIT_URL : URL HTTPS GitLab du projet à analyser
- BRANCH : Branche Git (default: main)
- LANGUAGE : Langage (auto, python, javascript, java)
- DEPLOY_ENV : Environnement (test, staging, production-simulation)
- RUN_TESTS : Activer les tests unitaires
- RUN_QUALITY : Activer l'analyse qualité
- RUN_SECURITY : Activer SAST + secrets + dépendances
- RUN_AI : Activer le module IA
- PUSH_IMAGE : Pousser l'image vers le registre
- SIGN_IMAGE : Signer l'image avec Cosign
- DEPLOY : Déployer l'application

**Credentials Jenkins requis :**
- gitlab-private-token : Token GitLab pour le clonage des repos
- gitlab-registry-token : Username + Token pour le Container Registry
- gemini-api-key : Clé API Google Gemini (secret string)
- cosign-private-key : Clé privée Cosign (fichier)
- cosign-password : Mot de passe de la clé Cosign
- cosign-public-key : Clé publique Cosign (fichier)

---

### 4.5 Policy as Code — OPA (Open Policy Agent)

**Chemin :** jenkins-pipeline/policy/devsecops.rego
**Langage :** Rego

**Rôle :** Définit les règles de sécurité qui autorisent ou bloquent automatiquement le déploiement.

**Règles implémentées :**

| Condition | Seuil | Action |
|---|---|---|
| Tests échoués | > 0 | BLOCAGE |
| Bugs qualité | > 10 | BLOCAGE |
| SonarQube Quality Gate | != PASSED | BLOCAGE |
| SAST status | != PASSED | BLOCAGE |
| SAST blocking findings | > 0 | BLOCAGE |
| Vulnérabilités dépendances | > 0 | BLOCAGE |
| Secrets détectés | > 0 | BLOCAGE |
| Vulnérabilités container CRITICAL | > 0 | BLOCAGE |
| Vulnérabilités container HIGH | >= 5 | BLOCAGE |
| SBOM status | != PASSED | BLOCAGE |

---

### 4.6 Base de données PostgreSQL

**Version :** PostgreSQL 16
**ORM :** SQLAlchemy (psycopg3 driver)

**Tables principales :**
- projects : Projets GitLab configurés dans la plateforme
- pipelines : Chaque exécution Jenkins (1 ligne = 1 build)
- test_results : Résultats des tests (total, passés, échoués)
- quality_results : Statut qualité et nombre de bugs
- security_results : Statut sécurité et nombre de vulnérabilités
- deployment_results : Décision finale (APPROVED / REJECTED)
- ai_results : Rapport complet de l'IA (JSON brut + résumé)

---

### 4.7 SonarQube

**Version :** Community Edition
**Port :** 9001
**Rôle :** Analyse statique de la qualité du code : bugs, code smells, duplication, couverture de tests.

---

## 5. FLUX DE DONNÉES COMPLET

1. L'utilisateur remplit le formulaire dans le Frontend (URL GitLab, options)
2. Le Frontend POST /pipelines → Backend FastAPI
3. Le Backend FastAPI enregistre le pipeline dans PostgreSQL (statut RUNNING)
4. Le Backend appelle l'API Jenkins REST pour déclencher le build
5. Jenkins démarre le pipeline Groovy (Jenkinsfile)
6. Jenkins exécute les 20+ stages en séquence : Clone GitLab → Tests → Qualité → SonarQube → SAST → Dépendances → Secrets → Docker Build → Trivy → SBOM → Gemini AI → OPA → Deploy
7. A chaque étape, Jenkins génère des artefacts dans reports/ (test-results.xml, sast-report.json, ai-security-report.json, etc.)
8. Le Frontend poll /pipelines/{build} toutes les 2,5s pour l'état du build
9. L'utilisateur clique sur "Security Results" → Frontend GET /reports/{build}/security
10. Le Backend FastAPI appelle Jenkins REST API pour récupérer l'artefact
11. Le Backend parse le rapport, sauvegarde dans PostgreSQL, retourne le JSON au Frontend
12. Le Frontend affiche les résultats dans l'interface avec graphiques et badges de sévérité

---

## 6. TECHNOLOGIES ET STACK TECHNOLOGIQUE COMPLET

### Backend
| Technologie | Version | Usage |
|---|---|---|
| Python | 3.12 | Langage principal du backend |
| FastAPI | Latest | Framework API REST asynchrone |
| Uvicorn | Latest | Serveur ASGI |
| SQLAlchemy | Latest | ORM base de données |
| psycopg3 | Latest | Driver PostgreSQL |
| Pydantic | Latest | Validation des données / schémas |
| python-dotenv | Latest | Gestion des variables d'environnement |
| Requests | Latest | Appels HTTP vers Jenkins |

### Frontend
| Technologie | Version | Usage |
|---|---|---|
| Next.js | 15.5.18 | Framework React SSR |
| TypeScript | 5.x | Typage statique |
| TailwindCSS | 3.4.17 | Styling utilitaire |
| Radix UI / shadcn | Latest | Composants accessibles |
| Recharts | 2.15.4 | Graphiques et visualisations |
| Lucide React | 0.454 | Icônes SVG |
| Sonner | 1.7.4 | Notifications toast |
| React | 19 | Bibliothèque UI |

### Infrastructure & DevSecOps
| Outil | Version | Usage |
|---|---|---|
| Jenkins | LTS | Orchestrateur CI/CD |
| PostgreSQL | 16 | Base de données relationnelle |
| SonarQube | Community | Qualité et sécurité du code |
| Docker | Latest | Conteneurisation |
| Docker Compose | 5.5.0 | Orchestration locale |
| GitLab | SaaS / Self-hosted | SCM + Container Registry |

### Outils de Sécurité
| Outil | Version | Usage |
|---|---|---|
| Semgrep | 1.175.0 | SAST (Static Application Security Testing) |
| Trivy | 0.74.0 | Scan de vulnérabilités container + dépendances |
| Gitleaks | 8.21.2 | Détection de secrets dans le code |
| pip-audit | Latest | Audit des dépendances Python |
| npm audit | Built-in | Audit des dépendances JavaScript |
| OPA (Open Policy Agent) | 1.19.1 | Policy as Code (Rego) |
| Cosign (Sigstore) | 3.1.3 | Signature et vérification d'images Docker |
| Syft (Anchore) | 1.51.1 | Génération de SBOM (CycloneDX / SPDX) |

### Intelligence Artificielle
| Technologie | Usage |
|---|---|
| Google Gemini (gemini-3.7-flash) | LLM pour l'analyse des rapports de sécurité |
| google-genai SDK | Client Python pour l'API Gemini |
| JSON Schema strict | Garantit une réponse IA structurée et parsable |

---

## 7. FONCTIONNALITÉS CLÉS RÉALISÉES

### 7.1 Pipeline DevSecOps Multi-langages
- Détection automatique du langage du projet (Python, JavaScript, Java)
- Support des gestionnaires de paquets : pip, npm, Maven
- Tests unitaires : pytest, Jest, JUnit
- Analyse qualité : pylint, ESLint, SonarQube

### 7.2 Sécurité Intégrée "Shift-Left"
- SAST avec Semgrep (règles OWASP, injection, XSS, cryptographie)
- Audit des dépendances (CVE) avec pip-audit / npm audit / OWASP Dependency-Check
- Détection de secrets avec Gitleaks
- Scan de l'image Docker avec Trivy (vulnérabilités OS + bibliothèques)
- Génération automatique du SBOM (inventaire de 85+ composants pour une app Python)

### 7.3 Policy as Code (OPA / Rego)
- Politiques de sécurité déclaratives et versionnées
- Évaluation automatique : 10 règles de blocage différentes
- Rapport détaillé des raisons de blocage ou d'approbation
- Tests unitaires des politiques (devsecops_test.rego)

### 7.4 Signature d'Images Docker (Supply Chain Security)
- Signature cryptographique avec Cosign (paire de clés asymétriques)
- Vérification de la signature avant déploiement
- Garantit l'intégrité de l'image (impossible de déployer une image altérée)

### 7.5 Module IA — Gemini Security Advisor
- Analyse des 4 rapports de sécurité (SAST, dépendances, container, SBOM) par Gemini
- Recommandations priorisées (Critical/High/Medium/Low)
- Plan d'action en étapes concrètes
- Assistant de décision de déploiement
- JSON Schema strict pour garantir la cohérence des réponses

### 7.6 Plateforme de Gestion (Frontend + Backend)
- Dashboard avec statistiques globales (taux de succès, répartition des statuts)
- Suivi temps réel du pipeline (logs Jenkins en streaming)
- Visualisation détaillée de chaque rapport (graphiques, tableaux, badges colorés)
- Gestion de projets GitLab multiples
- Page Settings avec 7 sections de configuration

### 7.7 Persistence & Historique
- Toutes les données de pipeline stockées dans PostgreSQL
- Historique complet consultable pour chaque build
- Tendances de sécurité sur plusieurs builds

---

## 8. APPLICATION CIBLE UTILISÉE POUR LES TESTS

**Chemin :** sample-python-app/
**Technologie :** Flask 3.x + Gunicorn + pytest

L'application de démonstration est une API REST Python simple avec :
- GET / : Message de bienvenue
- GET /health : Endpoint de santé
- GET /api/users : Liste d'utilisateurs
- GET /api/status : Statut opérationnel

Elle sert de cible du pipeline : c'est cette application qui est analysée (SAST, dépendances, conteneur), testée (pytest), construite en image Docker et déployée.

**Résultats observés sur le build #138 :**
- 3 tests pytest passés
- 1 finding SAST Semgrep (non bloquant)
- 2 vulnérabilités HIGH Trivy (sous le seuil de 5)
- 85 composants dans le SBOM
- OPA : 0 denial → DEPLOYMENT ALLOWED
- Image signée avec Cosign et publiée sur GitLab Registry
- Application déployée et accessible sur le port 5003
- 3 recommandations IA Gemini générées

---

## 9. DÉFIS TECHNIQUES RENCONTRÉS ET SOLUTIONS

| Défi | Solution apportée |
|---|---|
| Réponse IA non structurée de Gemini | Utilisation d'un JSON Schema strict avec google-genai SDK + validation Pydantic |
| Pipeline Jenkins trop grand (MethodTooLargeException) | Extraction des stages en méthodes Groovy avec @groovy.transform.Field |
| Polling temps réel des logs Jenkins | Polling HTTP toutes les 2,5s avec setInterval côté Next.js |
| Décision de déploiement divergente entre IA et OPA | Architecture clarifiée : OPA = décision autoritaire, Gemini = avis consultatif |
| Sous-modules Git vides sur le serveur company | Architecture Git expliquée : 160000 commit = sous-module vs 040000 tree = dossier normal |
| Variables d'environnement manquantes | Création de .env.example complets dans chaque sous-projet |
| Jenkins sans outils DevSecOps | Dockerfile Jenkins custom embarquant 7 outils de sécurité |

---

## 10. RÉSULTATS ET LIVRABLES

### Livrables produits :
1. Image Docker Jenkins custom avec 7 outils DevSecOps intégrés
2. Jenkinsfile de 2929 lignes avec 20+ stages multi-langages
3. API FastAPI avec 5 routers et 20+ endpoints REST
4. Interface Next.js avec 11 pages et visualisation temps réel
5. Module IA (Python) intégrant Google Gemini dans le pipeline Jenkins
6. Politiques OPA déclaratives avec tests unitaires Rego
7. Base de données PostgreSQL avec 7 tables relationnelles
8. Dump SQL de la base avec données réelles de 138+ builds

### Indicateurs de performance (build #138) :
- Durée totale du pipeline : ~15 minutes (20+ stages)
- Couverture des langages supportés : Python, JavaScript, Java
- Outils de sécurité intégrés : 8 (Semgrep, Trivy, Gitleaks, pip-audit, npm audit, OPA, Cosign, Syft)
- Précision du rapport IA : 100% (JSON validé par schema strict)
- Persistance : 100% des données en base PostgreSQL

---

## 11. POINTS D'AMÉLIORATION POTENTIELS

1. Settings backend : Les endpoints GET/PUT /settings ne sont pas encore implémentés dans FastAPI (le frontend affiche les valeurs en mode "preview" local)
2. Sous-modules Git : La structure en sous-modules rend les dossiers non navigables sur le serveur GitLab d'entreprise (solution : convertir en monorepo complet)
3. Authentication : L'API FastAPI n'implémente pas d'authentification utilisateur (JWT, OAuth)
4. Tests backend : Pas de tests unitaires pour l'API FastAPI
5. SBOM compliance : Le module de conformité SBOM pourrait vérifier des licences spécifiques (GPL, MIT, etc.)

---

## 12. MOTS-CLÉS TECHNIQUES

DevSecOps, CI/CD, Pipeline as Code, Shift-Left Security, SAST, DAST, SCA (Software Composition Analysis), SBOM (Software Bill of Materials), CycloneDX, SPDX, Policy as Code, OPA (Open Policy Agent), Rego, Cosign, Sigstore, Supply Chain Security, Container Security, Trivy, Semgrep, Gitleaks, SonarQube, Quality Gate, FastAPI, SQLAlchemy, PostgreSQL, Next.js, TypeScript, TailwindCSS, REST API, Large Language Model (LLM), Google Gemini, Prompt Engineering, JSON Schema, Jenkins, Groovy DSL, Docker, GitLab Registry, Docker Compose, Micro-services Architecture, Git Submodule, Python-dotenv, Pydantic, Radix UI, shadcn/ui, Real-time Polling, JUnit XML, CycloneDX JSON.

---

## 13. INSTRUCTIONS POUR CHATGPT

Utilise ce document comme base de connaissance complète pour rédiger un rapport de stage académique de 2 mois (été 2026) en langue française.

Le rapport doit couvrir :
1. Introduction et contexte (entreprise, problématique, objectifs)
2. Etat de l'art (DevSecOps, CI/CD, outils de sécurité, IA dans la sécurité)
3. Architecture technique (diagramme textuel, choix technologiques justifiés)
4. Réalisation (description détaillée de chaque composant développé)
5. Résultats et validation (captures d'écran décrites, métriques du build #138)
6. Difficultés et solutions (défis techniques rencontrés)
7. Perspectives et améliorations (ce qui pourrait être fait ensuite)
8. Conclusion

Le ton doit être académique et professionnel, avec une utilisation appropriée de la terminologie technique. Le rapport doit montrer une maîtrise des concepts DevSecOps, de l'architecture logicielle, et de l'intégration de l'intelligence artificielle dans les pipelines CI/CD.
