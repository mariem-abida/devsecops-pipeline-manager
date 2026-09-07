--
-- PostgreSQL database dump
--

\restrict zrXjju9oXMi9KSPf8It0l4f6fobxhmn8j25AvlnfJY7Tn5htBRuLxQwucYP2Oqt

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_results (
    id integer NOT NULL,
    pipeline_id integer NOT NULL,
    status character varying,
    model character varying,
    report text,
    raw_report text,
    created_at timestamp without time zone
);


--
-- Name: ai_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_results_id_seq OWNED BY public.ai_results.id;


--
-- Name: deployment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deployment_results (
    id integer NOT NULL,
    pipeline_id integer NOT NULL,
    build_number character varying NOT NULL,
    decision character varying,
    raw_report text,
    created_at timestamp without time zone
);


--
-- Name: deployment_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deployment_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: deployment_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deployment_results_id_seq OWNED BY public.deployment_results.id;


--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipelines (
    id integer NOT NULL,
    project_id integer NOT NULL,
    build_number character varying NOT NULL,
    status character varying,
    progress integer,
    current_stage character varying,
    duration character varying,
    environment character varying,
    run_tests boolean,
    run_quality boolean,
    run_security boolean,
    dependency_audit boolean,
    secret_detection boolean,
    generate_ai_suggestions boolean,
    deploy_if_validated boolean,
    created_at timestamp without time zone
);


--
-- Name: pipelines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pipelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pipelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pipelines_id_seq OWNED BY public.pipelines.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying NOT NULL,
    repository_url character varying NOT NULL,
    branch character varying,
    language character varying NOT NULL,
    visibility character varying NOT NULL,
    access_method character varying NOT NULL,
    credential_id character varying,
    description character varying,
    last_pipeline_status character varying,
    created_at timestamp without time zone
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: quality_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quality_results (
    id integer NOT NULL,
    pipeline_id integer NOT NULL,
    build_number character varying NOT NULL,
    status character varying,
    issue_count integer,
    raw_report text,
    created_at timestamp without time zone
);


--
-- Name: quality_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quality_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quality_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quality_results_id_seq OWNED BY public.quality_results.id;


--
-- Name: security_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_results (
    id integer NOT NULL,
    pipeline_id integer NOT NULL,
    build_number character varying NOT NULL,
    status character varying,
    vulnerability_count integer,
    raw_report text,
    created_at timestamp without time zone
);


--
-- Name: security_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.security_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: security_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.security_results_id_seq OWNED BY public.security_results.id;


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_results (
    id integer NOT NULL,
    pipeline_id integer NOT NULL,
    build_number character varying NOT NULL,
    total integer,
    passed integer,
    failed integer,
    skipped integer,
    status character varying,
    raw_report text,
    created_at timestamp without time zone
);


--
-- Name: test_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.test_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.test_results_id_seq OWNED BY public.test_results.id;


--
-- Name: ai_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_results ALTER COLUMN id SET DEFAULT nextval('public.ai_results_id_seq'::regclass);


--
-- Name: deployment_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployment_results ALTER COLUMN id SET DEFAULT nextval('public.deployment_results_id_seq'::regclass);


--
-- Name: pipelines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines ALTER COLUMN id SET DEFAULT nextval('public.pipelines_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: quality_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_results ALTER COLUMN id SET DEFAULT nextval('public.quality_results_id_seq'::regclass);


--
-- Name: security_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_results ALTER COLUMN id SET DEFAULT nextval('public.security_results_id_seq'::regclass);


--
-- Name: test_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results ALTER COLUMN id SET DEFAULT nextval('public.test_results_id_seq'::regclass);


--
-- Data for Name: ai_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_results (id, pipeline_id, status, model, report, raw_report, created_at) FROM stdin;
3	20	PASSED	Unknown	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "OpenSSL Denial of Service vulnerability in libcrypto3 (CVE-2026-14456)",\n      "explanation": "Unbounded memory growth in OpenSSL QUIC server can lead to Denial of Service conditions.",\n      "suggestion": "Upgrade base image or libcrypto3 to 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Container runtime DoS risk"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "OpenSSL Denial of Service vulnerability in libssl3 (CVE-2026-14456)",\n      "explanation": "Unbounded memory growth in OpenSSL QUIC server can lead to Denial of Service conditions.",\n      "suggestion": "Upgrade base image or libssl3 to 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Container runtime DoS risk"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "Out-of-bounds read and crash in msgpack (GHSA-6v7p-g79w-8964)",\n      "explanation": "MessagePack for Python suffers from out-of-bounds read and application crash on Unpacker reuse following caught errors.",\n      "suggestion": "Update msgpack dependency to version 1.2.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Application crash risk"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "Path Traversal Vulnerability in setuptools (CVE-2025-47273)",\n      "explanation": "Path traversal flaw in setuptools PackageIndex allows unauthorized path traversal during package resolution.",\n      "suggestion": "Upgrade setuptools package to 78.1.1 or higher in build dependencies.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Supply chain and build integrity risk"\n    },\n    {\n      "id": 5,\n      "priority": "Medium",\n      "category": "Code Quality",\n      "problem": "Hardcoded configuration TESTING in test_app.py",\n      "explanation": "Hardcoded testing flag detected at test_app.py:12. Hardcoded values can leak into production or obscure test state.",\n      "suggestion": "Refactor hardcoded TESTING variable to read from environment variables or configuration files.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Low runtime impact; security best-practice non-compliance"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Update Base Container Image",\n      "items": [\n        "Rebuild container using updated Alpine/OS base image with OpenSSL >= 3.5.8-r0"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Remediate Python Dependencies",\n      "items": [\n        "Update msgpack to >= 1.2.1 in requirements.txt",\n        "Update setuptools to >= 78.1.1 in pyproject.toml / requirements.txt"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Clean Up Code Security Warnings",\n      "items": [\n        "Refactor hardcoded TESTING config variable in test_app.py to environment variable load"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High severity container vulnerabilities detected",\n    "requirements": [\n      "Zero High or Critical vulnerabilities in container scan",\n      "Resolved static code security analysis warnings"\n    ],\n    "next_action": "Patch container dependencies and re-run CI pipeline"\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#106",\n    "ai_mode": "Security Report Interpretation",\n    "generated_at": "2026-08-31 11:29 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "OpenSSL Denial of Service vulnerability in libcrypto3 (CVE-2026-14456)",\n      "explanation": "Unbounded memory growth in OpenSSL QUIC server can lead to Denial of Service conditions.",\n      "suggestion": "Upgrade base image or libcrypto3 to 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Container runtime DoS risk"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "OpenSSL Denial of Service vulnerability in libssl3 (CVE-2026-14456)",\n      "explanation": "Unbounded memory growth in OpenSSL QUIC server can lead to Denial of Service conditions.",\n      "suggestion": "Upgrade base image or libssl3 to 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Container runtime DoS risk"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "Out-of-bounds read and crash in msgpack (GHSA-6v7p-g79w-8964)",\n      "explanation": "MessagePack for Python suffers from out-of-bounds read and application crash on Unpacker reuse following caught errors.",\n      "suggestion": "Update msgpack dependency to version 1.2.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Application crash risk"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "Path Traversal Vulnerability in setuptools (CVE-2025-47273)",\n      "explanation": "Path traversal flaw in setuptools PackageIndex allows unauthorized path traversal during package resolution.",\n      "suggestion": "Upgrade setuptools package to 78.1.1 or higher in build dependencies.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Supply chain and build integrity risk"\n    },\n    {\n      "id": 5,\n      "priority": "Medium",\n      "category": "Code Quality",\n      "problem": "Hardcoded configuration TESTING in test_app.py",\n      "explanation": "Hardcoded testing flag detected at test_app.py:12. Hardcoded values can leak into production or obscure test state.",\n      "suggestion": "Refactor hardcoded TESTING variable to read from environment variables or configuration files.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Low runtime impact; security best-practice non-compliance"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Update Base Container Image",\n      "items": [\n        "Rebuild container using updated Alpine/OS base image with OpenSSL >= 3.5.8-r0"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Remediate Python Dependencies",\n      "items": [\n        "Update msgpack to >= 1.2.1 in requirements.txt",\n        "Update setuptools to >= 78.1.1 in pyproject.toml / requirements.txt"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Clean Up Code Security Warnings",\n      "items": [\n        "Refactor hardcoded TESTING config variable in test_app.py to environment variable load"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High severity container vulnerabilities detected",\n    "requirements": [\n      "Zero High or Critical vulnerabilities in container scan",\n      "Resolved static code security analysis warnings"\n    ],\n    "next_action": "Patch container dependencies and re-run CI pipeline"\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#106",\n    "ai_mode": "Security Report Interpretation",\n    "generated_at": "2026-08-31 11:29 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-08-31 15:33:51.881509
36	22	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #108\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #108\n- Environment: test\n	2026-08-31 16:41:15.641178
37	23	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #109\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #109\n- Environment: test\n	2026-08-31 16:48:53.082037
38	24	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #110\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #110\n- Environment: test\n	2026-08-31 17:03:39.127131
39	25	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "CVE-2026-14456 in libcrypto3",\n      "explanation": "OpenSSL libcrypto3 v3.5.7 is vulnerable to a Denial of Service attack via unbounded memory growth in QUIC server implementations.",\n      "suggestion": "Update libcrypto3 to version 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "CVE-2026-14456 in libssl3",\n      "explanation": "OpenSSL libssl3 v3.5.7 is vulnerable to a Denial of Service attack via unbounded memory growth in QUIC server implementations.",\n      "suggestion": "Update libssl3 to version 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "GHSA-6v7p-g79w-8964 in msgpack",\n      "explanation": "MessagePack for Python v1.1.2 is vulnerable to an out-of-bounds read and application crash when reusing an Unpacker.",\n      "suggestion": "Upgrade msgpack to version 1.2.1 or later.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "CVE-2025-47273 in setuptools",\n      "explanation": "setuptools v70.3.0 contains a path traversal vulnerability in the PackageIndex component.",\n      "suggestion": "Upgrade setuptools to version 78.1.1 or later.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 5,\n      "priority": "Medium",\n      "category": "Configuration",\n      "problem": "Hardcoded configuration in test_app.py",\n      "explanation": "The TESTING flag is hardcoded within the application source code instead of using environment variables.",\n      "suggestion": "Refactor the configuration to load settings from an environment variable or external config file.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Recommended fix before production"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate container vulnerabilities",\n      "items": [\n        "Update base image dependencies to address libcrypto3 and libssl3",\n        "Upgrade pip packages msgpack and setuptools in the Dockerfile"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Refactor application configuration",\n      "items": [\n        "Remove hardcoded TESTING flag in test_app.py",\n        "Implement configuration management using environment variables"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High severity vulnerabilities detected in production-grade libraries.",\n    "requirements": [\n      "Resolution of all high-severity container vulnerabilities",\n      "Removal of hardcoded secrets/configs"\n    ],\n    "next_action": "Apply package updates and re-trigger pipeline"\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#111",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 17:13 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "CVE-2026-14456 in libcrypto3",\n      "explanation": "OpenSSL libcrypto3 v3.5.7 is vulnerable to a Denial of Service attack via unbounded memory growth in QUIC server implementations.",\n      "suggestion": "Update libcrypto3 to version 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "CVE-2026-14456 in libssl3",\n      "explanation": "OpenSSL libssl3 v3.5.7 is vulnerable to a Denial of Service attack via unbounded memory growth in QUIC server implementations.",\n      "suggestion": "Update libssl3 to version 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "GHSA-6v7p-g79w-8964 in msgpack",\n      "explanation": "MessagePack for Python v1.1.2 is vulnerable to an out-of-bounds read and application crash when reusing an Unpacker.",\n      "suggestion": "Upgrade msgpack to version 1.2.1 or later.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Vulnerability",\n      "problem": "CVE-2025-47273 in setuptools",\n      "explanation": "setuptools v70.3.0 contains a path traversal vulnerability in the PackageIndex component.",\n      "suggestion": "Upgrade setuptools to version 78.1.1 or later.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 5,\n      "priority": "Medium",\n      "category": "Configuration",\n      "problem": "Hardcoded configuration in test_app.py",\n      "explanation": "The TESTING flag is hardcoded within the application source code instead of using environment variables.",\n      "suggestion": "Refactor the configuration to load settings from an environment variable or external config file.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Recommended fix before production"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate container vulnerabilities",\n      "items": [\n        "Update base image dependencies to address libcrypto3 and libssl3",\n        "Upgrade pip packages msgpack and setuptools in the Dockerfile"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Refactor application configuration",\n      "items": [\n        "Remove hardcoded TESTING flag in test_app.py",\n        "Implement configuration management using environment variables"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High severity vulnerabilities detected in production-grade libraries.",\n    "requirements": [\n      "Resolution of all high-severity container vulnerabilities",\n      "Removal of hardcoded secrets/configs"\n    ],\n    "next_action": "Apply package updates and re-trigger pipeline"\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#111",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 17:13 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-08-31 17:15:07.163736
40	27	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #113\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #113\n- Environment: test\n	2026-08-31 18:25:40.311532
41	29	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Dependency",\n      "problem": "High severity CVE in libcrypto3 and libssl3",\n      "explanation": "OpenSSL versions 3.5.7 are vulnerable to DoS via unbounded memory growth in QUIC server component.",\n      "suggestion": "Upgrade base container image to use libcrypto3 and libssl3 version 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Dependency",\n      "problem": "Vulnerability in msgpack library",\n      "explanation": "GHSA-6v7p-g79w-8964 allows for potential crash on Unpacker reuse after a caught error.",\n      "suggestion": "Update msgpack package to version 1.2.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency",\n      "problem": "Path traversal vulnerability in setuptools",\n      "explanation": "CVE-2025-47273 allows an attacker to perform path traversal during package index operations.",\n      "suggestion": "Update setuptools to version 78.1.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "Medium",\n      "category": "SAST",\n      "problem": "Hardcoded TESTING configuration",\n      "explanation": "Hardcoded configuration values in source code pose a risk of misconfiguration in production environments.",\n      "suggestion": "Refactor test_app.py to load configurations from environment variables or a secure configuration provider.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Warning only"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate container vulnerabilities",\n      "items": [\n        "Update base Docker image to latest patched version",\n        "Rebuild and rescan the container image"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Remediate application dependencies",\n      "items": [\n        "Update requirements.txt to include msgpack 1.2.1",\n        "Update setuptools to 78.1.1"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Improve configuration management",\n      "items": [\n        "Remove hardcoded TESTING variable in test_app.py",\n        "Implement environment variable lookup using os.getenv"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Multiple High severity vulnerabilities detected in production container components.",\n    "requirements": [\n      "Remediate all High severity container vulnerabilities",\n      "Remediate all High severity library vulnerabilities"\n    ],\n    "next_action": "Apply dependency and image updates then re-run pipeline"\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#115",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 18:58 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Dependency",\n      "problem": "High severity CVE in libcrypto3 and libssl3",\n      "explanation": "OpenSSL versions 3.5.7 are vulnerable to DoS via unbounded memory growth in QUIC server component.",\n      "suggestion": "Upgrade base container image to use libcrypto3 and libssl3 version 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Dependency",\n      "problem": "Vulnerability in msgpack library",\n      "explanation": "GHSA-6v7p-g79w-8964 allows for potential crash on Unpacker reuse after a caught error.",\n      "suggestion": "Update msgpack package to version 1.2.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency",\n      "problem": "Path traversal vulnerability in setuptools",\n      "explanation": "CVE-2025-47273 allows an attacker to perform path traversal during package index operations.",\n      "suggestion": "Update setuptools to version 78.1.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "Medium",\n      "category": "SAST",\n      "problem": "Hardcoded TESTING configuration",\n      "explanation": "Hardcoded configuration values in source code pose a risk of misconfiguration in production environments.",\n      "suggestion": "Refactor test_app.py to load configurations from environment variables or a secure configuration provider.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Warning only"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate container vulnerabilities",\n      "items": [\n        "Update base Docker image to latest patched version",\n        "Rebuild and rescan the container image"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Remediate application dependencies",\n      "items": [\n        "Update requirements.txt to include msgpack 1.2.1",\n        "Update setuptools to 78.1.1"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Improve configuration management",\n      "items": [\n        "Remove hardcoded TESTING variable in test_app.py",\n        "Implement environment variable lookup using os.getenv"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Multiple High severity vulnerabilities detected in production container components.",\n    "requirements": [\n      "Remediate all High severity container vulnerabilities",\n      "Remediate all High severity library vulnerabilities"\n    ],\n    "next_action": "Apply dependency and image updates then re-run pipeline"\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#115",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 18:58 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-08-31 19:00:25.231552
42	31	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #117\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #117\n- Environment: test\n	2026-08-31 19:29:58.720768
43	32	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 1,\n  "critical_count": 0,\n  "high_count": 0,\n  "medium_count": 0,\n  "low_count": 1,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Low",\n      "category": "Compliance",\n      "problem": "Software Bill of Materials (SBOM) not detected",\n      "explanation": "The scan pipeline failed to identify any components, resulting in an empty SBOM. This indicates that dependencies may not be correctly defined or the scan tool is misconfigured for this project environment.",\n      "suggestion": "Ensure requirements.txt or pyproject.toml is present and correctly formatted in the root directory, and verify that the build process correctly triggers the dependency scanning tool.",\n      "relatedTool": "pip-audit",\n      "deploymentImpact": "Does not block deployment but hinders supply chain security visibility."\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Verify Dependency Configuration",\n      "items": [\n        "Confirm requirements.txt exists in the repository root",\n        "Verify build logs to ensure dependency installation occurs before scanning"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Validate Pipeline Integration",\n      "items": [\n        "Check pipeline configuration to ensure tools are scanning the correct directory",\n        "Confirm tool version compatibility with the Python environment"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Approved",\n    "deployment_blocked": false,\n    "main_reason": "No critical or high-risk security vulnerabilities identified in the current build.",\n    "requirements": [\n      "No critical vulnerabilities",\n      "No high vulnerabilities"\n    ],\n    "next_action": "Proceed with deployment to test environment and investigate the missing SBOM."\n  },\n  "context": {\n    "project": "sample-python-calculator",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#118",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 19:52 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 1,\n  "critical_count": 0,\n  "high_count": 0,\n  "medium_count": 0,\n  "low_count": 1,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Low",\n      "category": "Compliance",\n      "problem": "Software Bill of Materials (SBOM) not detected",\n      "explanation": "The scan pipeline failed to identify any components, resulting in an empty SBOM. This indicates that dependencies may not be correctly defined or the scan tool is misconfigured for this project environment.",\n      "suggestion": "Ensure requirements.txt or pyproject.toml is present and correctly formatted in the root directory, and verify that the build process correctly triggers the dependency scanning tool.",\n      "relatedTool": "pip-audit",\n      "deploymentImpact": "Does not block deployment but hinders supply chain security visibility."\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Verify Dependency Configuration",\n      "items": [\n        "Confirm requirements.txt exists in the repository root",\n        "Verify build logs to ensure dependency installation occurs before scanning"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Validate Pipeline Integration",\n      "items": [\n        "Check pipeline configuration to ensure tools are scanning the correct directory",\n        "Confirm tool version compatibility with the Python environment"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Approved",\n    "deployment_blocked": false,\n    "main_reason": "No critical or high-risk security vulnerabilities identified in the current build.",\n    "requirements": [\n      "No critical vulnerabilities",\n      "No high vulnerabilities"\n    ],\n    "next_action": "Proceed with deployment to test environment and investigate the missing SBOM."\n  },\n  "context": {\n    "project": "sample-python-calculator",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#118",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 19:52 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-08-31 19:53:08.225706
44	33	PASSED	gemini-3.6-flash	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Container Security",\n      "problem": "CVE-2026-14456 OpenSSL Denial of Service in libcrypto3",\n      "explanation": "OpenSSL contains a Denial of Service vulnerability via unbounded memory growth in the QUIC server component.",\n      "suggestion": "Upgrade libcrypto3 package to version 3.5.8-r0 or rebuild container using an updated base image.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity container vulnerability."\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Container Security",\n      "problem": "CVE-2026-14456 OpenSSL Denial of Service in libssl3",\n      "explanation": "OpenSSL contains a Denial of Service vulnerability via unbounded memory growth in the QUIC server component.",\n      "suggestion": "Upgrade libssl3 package to version 3.5.8-r0 or rebuild container using an updated base image.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity container vulnerability."\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "GHSA-6v7p-g79w-8964 Out-of-bounds read in msgpack",\n      "explanation": "MessagePack for Python is vulnerable to out-of-bounds read and application crash upon Unpacker reuse following a caught error.",\n      "suggestion": "Upgrade msgpack dependency to version 1.2.1 or higher in requirements.txt.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity package vulnerability."\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "CVE-2025-47273 Path Traversal in setuptools",\n      "explanation": "Setuptools contains a path traversal vulnerability in its PackageIndex component.",\n      "suggestion": "Upgrade setuptools to version 78.1.1 or higher in your environment build configuration.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity package vulnerability."\n    },\n    {\n      "id": 5,\n      "priority": "Medium",\n      "category": "Static Analysis",\n      "problem": "Hardcoded configuration TESTING in test_app.py",\n      "explanation": "Semgrep detected a hardcoded configuration variable TESTING at line 12 of test_app.py.",\n      "suggestion": "Refactor test_app.py to read configuration options from environment variables or dedicated configuration files.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Non-blocking for test environment, but recommended for code quality."\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate High-Severity Container Vulnerabilities",\n      "items": [\n        "Update base container image OS packages to fix libcrypto3 and libssl3 (version 3.5.8-r0 or higher)."\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Update Python Dependencies",\n      "items": [\n        "Update msgpack to version >= 1.2.1 in requirements.txt.",\n        "Update setuptools to version >= 78.1.1 in python environment definition."\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Clean Up Hardcoded Code Configurations",\n      "items": [\n        "Replace hardcoded TESTING variable in test_app.py with environment variable calls."\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "4 High-severity container and dependency vulnerabilities detected during Trivy scanning.",\n    "requirements": [\n      "Remediate all 4 High-severity CVE/GHSA findings in container and packages.",\n      "Re-run security pipeline with clean vulnerability scan."\n    ],\n    "next_action": "Update container base image and Python package versions, then trigger build #120."\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#119",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.6-flash",\n    "generated_at": "2026-08-31 19:57 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 5,\n  "critical_count": 0,\n  "high_count": 4,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Container Security",\n      "problem": "CVE-2026-14456 OpenSSL Denial of Service in libcrypto3",\n      "explanation": "OpenSSL contains a Denial of Service vulnerability via unbounded memory growth in the QUIC server component.",\n      "suggestion": "Upgrade libcrypto3 package to version 3.5.8-r0 or rebuild container using an updated base image.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity container vulnerability."\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Container Security",\n      "problem": "CVE-2026-14456 OpenSSL Denial of Service in libssl3",\n      "explanation": "OpenSSL contains a Denial of Service vulnerability via unbounded memory growth in the QUIC server component.",\n      "suggestion": "Upgrade libssl3 package to version 3.5.8-r0 or rebuild container using an updated base image.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity container vulnerability."\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "GHSA-6v7p-g79w-8964 Out-of-bounds read in msgpack",\n      "explanation": "MessagePack for Python is vulnerable to out-of-bounds read and application crash upon Unpacker reuse following a caught error.",\n      "suggestion": "Upgrade msgpack dependency to version 1.2.1 or higher in requirements.txt.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity package vulnerability."\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "CVE-2025-47273 Path Traversal in setuptools",\n      "explanation": "Setuptools contains a path traversal vulnerability in its PackageIndex component.",\n      "suggestion": "Upgrade setuptools to version 78.1.1 or higher in your environment build configuration.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks production deployment due to high-severity package vulnerability."\n    },\n    {\n      "id": 5,\n      "priority": "Medium",\n      "category": "Static Analysis",\n      "problem": "Hardcoded configuration TESTING in test_app.py",\n      "explanation": "Semgrep detected a hardcoded configuration variable TESTING at line 12 of test_app.py.",\n      "suggestion": "Refactor test_app.py to read configuration options from environment variables or dedicated configuration files.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Non-blocking for test environment, but recommended for code quality."\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate High-Severity Container Vulnerabilities",\n      "items": [\n        "Update base container image OS packages to fix libcrypto3 and libssl3 (version 3.5.8-r0 or higher)."\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Update Python Dependencies",\n      "items": [\n        "Update msgpack to version >= 1.2.1 in requirements.txt.",\n        "Update setuptools to version >= 78.1.1 in python environment definition."\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Clean Up Hardcoded Code Configurations",\n      "items": [\n        "Replace hardcoded TESTING variable in test_app.py with environment variable calls."\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "4 High-severity container and dependency vulnerabilities detected during Trivy scanning.",\n    "requirements": [\n      "Remediate all 4 High-severity CVE/GHSA findings in container and packages.",\n      "Re-run security pipeline with clean vulnerability scan."\n    ],\n    "next_action": "Update container base image and Python package versions, then trigger build #120."\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#119",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.6-flash",\n    "generated_at": "2026-08-31 19:57 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-08-31 19:58:41.624659
45	36	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 2,\n  "critical_count": 0,\n  "high_count": 0,\n  "medium_count": 1,\n  "low_count": 1,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Medium",\n      "category": "Compliance",\n      "problem": "Software Bill of Materials (SBOM) not generated",\n      "explanation": "No components were detected in the project, suggesting that dependencies are not being managed or tracked correctly in the CI/CD pipeline.",\n      "suggestion": "Implement a task to generate an SBOM (e.g., using CycloneDX) to ensure full visibility into project dependencies.",\n      "relatedTool": "CycloneDX-CLI",\n      "deploymentImpact": "Does not block deployment but poses a compliance risk"\n    },\n    {\n      "id": 2,\n      "priority": "Low",\n      "category": "Operational",\n      "problem": "Empty dependency scan results",\n      "explanation": "The dependency scan detected zero packages, which may indicate that the scan is not targeting the correct project directory or virtual environment.",\n      "suggestion": "Verify that requirements.txt or pyproject.toml are present and that the scan tool is correctly configured to traverse the workspace.",\n      "relatedTool": "pip-audit",\n      "deploymentImpact": "No impact on current deployment"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Validate Dependency Configuration",\n      "items": [\n        "Confirm project root contains dependency definition files",\n        "Ensure build environment installs dependencies before scanning"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Implement SBOM Generation",\n      "items": [\n        "Add CycloneDX generation step to CI pipeline",\n        "Archive SBOM artifacts for audit readiness"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Approved",\n    "deployment_blocked": false,\n    "main_reason": "No critical or high security vulnerabilities detected in static analysis or dependency audits.",\n    "requirements": [\n      "Verify application functionality in test environment",\n      "Implement dependency tracking for future compliance"\n    ],\n    "next_action": "Proceed to deployment"\n  },\n  "context": {\n    "project": "sample-python-calculator",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#122",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 20:16 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 2,\n  "critical_count": 0,\n  "high_count": 0,\n  "medium_count": 1,\n  "low_count": 1,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Medium",\n      "category": "Compliance",\n      "problem": "Software Bill of Materials (SBOM) not generated",\n      "explanation": "No components were detected in the project, suggesting that dependencies are not being managed or tracked correctly in the CI/CD pipeline.",\n      "suggestion": "Implement a task to generate an SBOM (e.g., using CycloneDX) to ensure full visibility into project dependencies.",\n      "relatedTool": "CycloneDX-CLI",\n      "deploymentImpact": "Does not block deployment but poses a compliance risk"\n    },\n    {\n      "id": 2,\n      "priority": "Low",\n      "category": "Operational",\n      "problem": "Empty dependency scan results",\n      "explanation": "The dependency scan detected zero packages, which may indicate that the scan is not targeting the correct project directory or virtual environment.",\n      "suggestion": "Verify that requirements.txt or pyproject.toml are present and that the scan tool is correctly configured to traverse the workspace.",\n      "relatedTool": "pip-audit",\n      "deploymentImpact": "No impact on current deployment"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Validate Dependency Configuration",\n      "items": [\n        "Confirm project root contains dependency definition files",\n        "Ensure build environment installs dependencies before scanning"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Implement SBOM Generation",\n      "items": [\n        "Add CycloneDX generation step to CI pipeline",\n        "Archive SBOM artifacts for audit readiness"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Approved",\n    "deployment_blocked": false,\n    "main_reason": "No critical or high security vulnerabilities detected in static analysis or dependency audits.",\n    "requirements": [\n      "Verify application functionality in test environment",\n      "Implement dependency tracking for future compliance"\n    ],\n    "next_action": "Proceed to deployment"\n  },\n  "context": {\n    "project": "sample-python-calculator",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#122",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-08-31 20:16 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-08-31 20:17:05.149002
46	38	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nTimeout has been exceeded\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #124\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nTimeout has been exceeded\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #124\n- Environment: test\n	2026-09-01 12:29:50.421482
47	40	FAILED	Unknown	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #126\n- Environment: test	# 🤖 AI Security Analysis Report\n\n## Status\n\n⚠️ AI Security Advisor failed to run.\n\n## Error\n\nscript returned exit code 1\n\n## Pipeline information\n\n- Project: sample-python-app\n- Build: #126\n- Environment: test\n	2026-09-01 12:45:45.807097
48	50	PASSED	gemini-3.7-flash	{\n  "total_recommendations": 3,\n  "critical_count": 0,\n  "high_count": 2,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Out-of-bounds read vulnerability in msgpack (GHSA-6v7p-g79w-8964)",\n      "explanation": "MessagePack for Python (msgpack@1.1.2) contains an out-of-bounds read / crash flaw when reusing an Unpacker instance after a caught error.",\n      "suggestion": "Upgrade msgpack dependency to version 1.2.1 or newer.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Path traversal vulnerability in setuptools (CVE-2025-47273)",\n      "explanation": "setuptools@70.3.0 is vulnerable to path traversal via PackageIndex, which may allow arbitrary file system writes during package resolution.",\n      "suggestion": "Upgrade setuptools to version 78.1.1 or newer in the container environment.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "Medium",\n      "category": "Code Quality",\n      "problem": "Hardcoded TESTING configuration in test_app.py",\n      "explanation": "Hardcoded variable TESTING detected at line 12. Storing configurations directly in code violates 12-factor application principles.",\n      "suggestion": "Read configuration values from environment variables or dedicated configuration management profiles.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Non-blocking warning"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate High-Severity Container Dependencies",\n      "items": [\n        "Bump msgpack to >= 1.2.1 in requirements.txt or container base image",\n        "Bump setuptools to >= 78.1.1 in the Dockerfile build stage"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Address SAST Warnings",\n      "items": [\n        "Refactor test_app.py to pull TESTING flag from environment variables"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High-severity vulnerabilities detected in container image dependencies (msgpack, setuptools)",\n    "requirements": [\n      "Zero High or Critical vulnerabilities in Trivy container scan",\n      "Successful SAST re-validation"\n    ],\n    "next_action": "Update msgpack and setuptools versions and trigger a new pipeline build."\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#138",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.7-flash",\n    "generated_at": "2026-09-03 13:48 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 3,\n  "critical_count": 0,\n  "high_count": 2,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Out-of-bounds read vulnerability in msgpack (GHSA-6v7p-g79w-8964)",\n      "explanation": "MessagePack for Python (msgpack@1.1.2) contains an out-of-bounds read / crash flaw when reusing an Unpacker instance after a caught error.",\n      "suggestion": "Upgrade msgpack dependency to version 1.2.1 or newer.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Path traversal vulnerability in setuptools (CVE-2025-47273)",\n      "explanation": "setuptools@70.3.0 is vulnerable to path traversal via PackageIndex, which may allow arbitrary file system writes during package resolution.",\n      "suggestion": "Upgrade setuptools to version 78.1.1 or newer in the container environment.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "Medium",\n      "category": "Code Quality",\n      "problem": "Hardcoded TESTING configuration in test_app.py",\n      "explanation": "Hardcoded variable TESTING detected at line 12. Storing configurations directly in code violates 12-factor application principles.",\n      "suggestion": "Read configuration values from environment variables or dedicated configuration management profiles.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Non-blocking warning"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate High-Severity Container Dependencies",\n      "items": [\n        "Bump msgpack to >= 1.2.1 in requirements.txt or container base image",\n        "Bump setuptools to >= 78.1.1 in the Dockerfile build stage"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Address SAST Warnings",\n      "items": [\n        "Refactor test_app.py to pull TESTING flag from environment variables"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High-severity vulnerabilities detected in container image dependencies (msgpack, setuptools)",\n    "requirements": [\n      "Zero High or Critical vulnerabilities in Trivy container scan",\n      "Successful SAST re-validation"\n    ],\n    "next_action": "Update msgpack and setuptools versions and trigger a new pipeline build."\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#138",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.7-flash",\n    "generated_at": "2026-09-03 13:48 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-09-03 14:00:27.791929
49	51	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 8,\n  "critical_count": 1,\n  "high_count": 23,\n  "medium_count": 0,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Critical",\n      "category": "Container Security",\n      "problem": "Dockerfile runs as root user",\n      "explanation": "The container executes processes with root privileges, increasing the attack surface if a container breakout occurs.",\n      "suggestion": "Add a 'USER node' instruction in the Dockerfile after creating a non-privileged system user.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Vulnerabilities in OpenSSL libraries (libcrypto3, libssl3)",\n      "explanation": "Critical Denial of Service (DoS) and Heap Use-After-Free vulnerabilities identified in the base image libraries.",\n      "suggestion": "Update the base image or upgrade the OpenSSL packages to 3.5.7-r0 or 3.5.8-r0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Vulnerable brace-expansion package",\n      "explanation": "Multiple DoS vectors exist in the installed version of brace-expansion allowing for memory exhaustion and complexity attacks.",\n      "suggestion": "Update 'brace-expansion' to version 5.0.9 or later via package manager.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Vulnerable cross-spawn package",\n      "explanation": "A ReDoS (Regular Expression Denial of Service) vulnerability exists in the current version of cross-spawn.",\n      "suggestion": "Upgrade cross-spawn to version 7.0.5 or 6.0.6.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 5,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Command Injection in glob",\n      "explanation": "The glob library version 10.4.2 is susceptible to command injection via malicious filenames.",\n      "suggestion": "Update glob to version 10.5.0 or 11.1.0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 6,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "SSRF vulnerability in ip-address package",\n      "explanation": "Inconsistent parsing leads to Server-Side Request Forgery risks.",\n      "suggestion": "Upgrade ip-address to version 10.3.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 7,\n      "priority": "High",\n      "category": "Compliance",\n      "problem": "Excessive high-severity vulnerabilities",\n      "explanation": "The current container image contains 23 high-severity vulnerabilities that violate security posture requirements.",\n      "suggestion": "Rebuild the image using a patched, minimal base image (e.g., Alpine 3.20+ or Distroless).",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 8,\n      "priority": "High",\n      "category": "Pipeline",\n      "problem": "Dependency drift",\n      "explanation": "Multiple production-critical dependencies are outdated with known CVEs.",\n      "suggestion": "Implement automated dependency updates using tools like Renovate or Dependabot.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate Dockerfile",\n      "items": [\n        "Update Dockerfile to run as non-root user"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Patch Dependencies",\n      "items": [\n        "Upgrade OpenSSL libraries",\n        "Update npm dependencies (brace-expansion, glob, cross-spawn, ip-address)"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Image Rebuild",\n      "items": [\n        "Rebuild container image from scratch",\n        "Run Trivy scan to verify clean state"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Multiple high-severity CVEs in system libraries and npm dependencies, combined with insecure container configuration.",\n    "requirements": [\n      "Remove root execution from Dockerfile",\n      "Remediate all high-severity CVEs"\n    ],\n    "next_action": "Update dependencies and Docker configuration"\n  },\n  "context": {\n    "project": "sample-node-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#139",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 14:17 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 8,\n  "critical_count": 1,\n  "high_count": 23,\n  "medium_count": 0,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Critical",\n      "category": "Container Security",\n      "problem": "Dockerfile runs as root user",\n      "explanation": "The container executes processes with root privileges, increasing the attack surface if a container breakout occurs.",\n      "suggestion": "Add a 'USER node' instruction in the Dockerfile after creating a non-privileged system user.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Vulnerabilities in OpenSSL libraries (libcrypto3, libssl3)",\n      "explanation": "Critical Denial of Service (DoS) and Heap Use-After-Free vulnerabilities identified in the base image libraries.",\n      "suggestion": "Update the base image or upgrade the OpenSSL packages to 3.5.7-r0 or 3.5.8-r0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Vulnerable brace-expansion package",\n      "explanation": "Multiple DoS vectors exist in the installed version of brace-expansion allowing for memory exhaustion and complexity attacks.",\n      "suggestion": "Update 'brace-expansion' to version 5.0.9 or later via package manager.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Vulnerable cross-spawn package",\n      "explanation": "A ReDoS (Regular Expression Denial of Service) vulnerability exists in the current version of cross-spawn.",\n      "suggestion": "Upgrade cross-spawn to version 7.0.5 or 6.0.6.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 5,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "Command Injection in glob",\n      "explanation": "The glob library version 10.4.2 is susceptible to command injection via malicious filenames.",\n      "suggestion": "Update glob to version 10.5.0 or 11.1.0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 6,\n      "priority": "High",\n      "category": "Dependency Management",\n      "problem": "SSRF vulnerability in ip-address package",\n      "explanation": "Inconsistent parsing leads to Server-Side Request Forgery risks.",\n      "suggestion": "Upgrade ip-address to version 10.3.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 7,\n      "priority": "High",\n      "category": "Compliance",\n      "problem": "Excessive high-severity vulnerabilities",\n      "explanation": "The current container image contains 23 high-severity vulnerabilities that violate security posture requirements.",\n      "suggestion": "Rebuild the image using a patched, minimal base image (e.g., Alpine 3.20+ or Distroless).",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 8,\n      "priority": "High",\n      "category": "Pipeline",\n      "problem": "Dependency drift",\n      "explanation": "Multiple production-critical dependencies are outdated with known CVEs.",\n      "suggestion": "Implement automated dependency updates using tools like Renovate or Dependabot.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate Dockerfile",\n      "items": [\n        "Update Dockerfile to run as non-root user"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Patch Dependencies",\n      "items": [\n        "Upgrade OpenSSL libraries",\n        "Update npm dependencies (brace-expansion, glob, cross-spawn, ip-address)"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Image Rebuild",\n      "items": [\n        "Rebuild container image from scratch",\n        "Run Trivy scan to verify clean state"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Multiple high-severity CVEs in system libraries and npm dependencies, combined with insecure container configuration.",\n    "requirements": [\n      "Remove root execution from Dockerfile",\n      "Remediate all high-severity CVEs"\n    ],\n    "next_action": "Update dependencies and Docker configuration"\n  },\n  "context": {\n    "project": "sample-node-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#139",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 14:17 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-09-03 14:20:06.195291
50	52	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 8,\n  "critical_count": 2,\n  "high_count": 3,\n  "medium_count": 2,\n  "low_count": 1,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Critical",\n      "category": "Container Security",\n      "problem": "Outdated OpenSSL libraries (libcrypto3/libssl3)",\n      "explanation": "The base image contains vulnerable OpenSSL versions susceptible to DoS and heap use-after-free exploits.",\n      "suggestion": "Update the base image to a version that includes OpenSSL 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "Critical",\n      "category": "Dependency Security",\n      "problem": "Command Injection in glob package",\n      "explanation": "CVE-2025-64756 allows attackers to perform command injection through maliciously crafted filenames.",\n      "suggestion": "Update glob to version 11.1.0 or 10.5.0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Denial of Service (DoS) in brace-expansion",\n      "explanation": "Multiple CVEs related to exponential-time complexity and memory exhaustion in the expand function.",\n      "suggestion": "Update brace-expansion to version 5.0.9 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "SSRF vulnerability in ip-address",\n      "explanation": "CVE-2026-69192 allows bypassing trust-boundaries through inconsistent IP parsing.",\n      "suggestion": "Upgrade the ip-address package to 10.3.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 5,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Regular expression DoS in cross-spawn",\n      "explanation": "CVE-2024-21538 vulnerability in input processing allowing potential application hangs.",\n      "suggestion": "Update cross-spawn to version 7.0.5 or 6.0.6.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 6,\n      "priority": "Medium",\n      "category": "Vulnerability Management",\n      "problem": "Lack of dependency pinning",\n      "explanation": "Unpinned dependencies lead to inconsistent security postures across environments.",\n      "suggestion": "Implement package-lock.json or yarn.lock to ensure reproducible builds.",\n      "relatedTool": "None",\n      "deploymentImpact": "Recommended"\n    },\n    {\n      "id": 7,\n      "priority": "Medium",\n      "category": "Operational Security",\n      "problem": "Large attack surface in base image",\n      "explanation": "The current container image contains unnecessary binaries increasing the blast radius.",\n      "suggestion": "Migrate to a distroless or minimal Alpine-based image.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Recommended"\n    },\n    {\n      "id": 8,\n      "priority": "Low",\n      "category": "Process",\n      "problem": "No SAST findings detected",\n      "explanation": "Zero SAST findings might indicate insufficient rule coverage or misconfiguration.",\n      "suggestion": "Review Semgrep ruleset configurations to ensure comprehensive coverage.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "None"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Patch Critical Vulnerabilities",\n      "items": [\n        "Update base container image to patch libcrypto3 and libssl3",\n        "Update glob package to version 10.5.0 or higher"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Remediate High Priority Dependencies",\n      "items": [\n        "Update brace-expansion, ip-address, and cross-spawn versions",\n        "Run npm/yarn audit to confirm resolution"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Re-verify",\n      "items": [\n        "Re-run the CI/CD pipeline to confirm scan results show zero critical/high vulnerabilities"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Multiple Critical and High severity vulnerabilities identified in container and dependencies",\n    "requirements": [\n      "Resolution of all Critical vulnerabilities",\n      "Resolution of all High vulnerabilities"\n    ],\n    "next_action": "Apply dependency and base image patches as outlined in action steps"\n  },\n  "context": {\n    "project": "sample-node-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#140",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 14:31 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 8,\n  "critical_count": 2,\n  "high_count": 3,\n  "medium_count": 2,\n  "low_count": 1,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "Critical",\n      "category": "Container Security",\n      "problem": "Outdated OpenSSL libraries (libcrypto3/libssl3)",\n      "explanation": "The base image contains vulnerable OpenSSL versions susceptible to DoS and heap use-after-free exploits.",\n      "suggestion": "Update the base image to a version that includes OpenSSL 3.5.8-r0 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 2,\n      "priority": "Critical",\n      "category": "Dependency Security",\n      "problem": "Command Injection in glob package",\n      "explanation": "CVE-2025-64756 allows attackers to perform command injection through maliciously crafted filenames.",\n      "suggestion": "Update glob to version 11.1.0 or 10.5.0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Denial of Service (DoS) in brace-expansion",\n      "explanation": "Multiple CVEs related to exponential-time complexity and memory exhaustion in the expand function.",\n      "suggestion": "Update brace-expansion to version 5.0.9 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "SSRF vulnerability in ip-address",\n      "explanation": "CVE-2026-69192 allows bypassing trust-boundaries through inconsistent IP parsing.",\n      "suggestion": "Upgrade the ip-address package to 10.3.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 5,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Regular expression DoS in cross-spawn",\n      "explanation": "CVE-2024-21538 vulnerability in input processing allowing potential application hangs.",\n      "suggestion": "Update cross-spawn to version 7.0.5 or 6.0.6.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 6,\n      "priority": "Medium",\n      "category": "Vulnerability Management",\n      "problem": "Lack of dependency pinning",\n      "explanation": "Unpinned dependencies lead to inconsistent security postures across environments.",\n      "suggestion": "Implement package-lock.json or yarn.lock to ensure reproducible builds.",\n      "relatedTool": "None",\n      "deploymentImpact": "Recommended"\n    },\n    {\n      "id": 7,\n      "priority": "Medium",\n      "category": "Operational Security",\n      "problem": "Large attack surface in base image",\n      "explanation": "The current container image contains unnecessary binaries increasing the blast radius.",\n      "suggestion": "Migrate to a distroless or minimal Alpine-based image.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Recommended"\n    },\n    {\n      "id": 8,\n      "priority": "Low",\n      "category": "Process",\n      "problem": "No SAST findings detected",\n      "explanation": "Zero SAST findings might indicate insufficient rule coverage or misconfiguration.",\n      "suggestion": "Review Semgrep ruleset configurations to ensure comprehensive coverage.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "None"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Patch Critical Vulnerabilities",\n      "items": [\n        "Update base container image to patch libcrypto3 and libssl3",\n        "Update glob package to version 10.5.0 or higher"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Remediate High Priority Dependencies",\n      "items": [\n        "Update brace-expansion, ip-address, and cross-spawn versions",\n        "Run npm/yarn audit to confirm resolution"\n      ]\n    },\n    {\n      "step": 3,\n      "title": "Re-verify",\n      "items": [\n        "Re-run the CI/CD pipeline to confirm scan results show zero critical/high vulnerabilities"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Multiple Critical and High severity vulnerabilities identified in container and dependencies",\n    "requirements": [\n      "Resolution of all Critical vulnerabilities",\n      "Resolution of all High vulnerabilities"\n    ],\n    "next_action": "Apply dependency and base image patches as outlined in action steps"\n  },\n  "context": {\n    "project": "sample-node-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#140",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 14:31 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-09-03 14:39:57.638767
51	53	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 8,\n  "critical_count": 1,\n  "high_count": 7,\n  "medium_count": 0,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Container Security",\n      "problem": "Dockerfile running as root user",\n      "explanation": "The Dockerfile does not specify a non-root user, causing processes to run with root privileges inside the container, increasing the blast radius of potential compromises.",\n      "suggestion": "Add 'USER nonroot' to your Dockerfile after creating the user and group.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Blocks deployment due to security policy"\n    },\n    {\n      "id": 2,\n      "priority": "Critical",\n      "category": "Dependency Security",\n      "problem": "Critical vulnerabilities in system libraries (libcrypto3, libssl3)",\n      "explanation": "OpenSSL components are susceptible to DoS via memory growth and Heap Use-After-Free vulnerabilities.",\n      "suggestion": "Upgrade the base container image to a version containing OpenSSL 3.5.8 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Denial of Service in brace-expansion",\n      "explanation": "The current version of brace-expansion is vulnerable to multiple DoS attacks via memory exhaustion and exponential complexity.",\n      "suggestion": "Update dependency brace-expansion to version 5.0.9 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Regular Expression Denial of Service in cross-spawn",\n      "explanation": "The cross-spawn library contains a ReDoS vulnerability that can lead to resource exhaustion.",\n      "suggestion": "Update cross-spawn to version 7.0.5.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    },\n    {\n      "id": 5,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Command Injection in glob",\n      "explanation": "A malicious filename can lead to command injection when processed by the current glob library version.",\n      "suggestion": "Update glob to version 11.1.0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    },\n    {\n      "id": 6,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "SSRF vulnerability in ip-address",\n      "explanation": "Inconsistent parsing logic allows for SSRF and trust-boundary bypasses.",\n      "suggestion": "Update ip-address to version 10.3.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate Container Vulnerabilities",\n      "items": [\n        "Update base image to patch OpenSSL vulnerabilities",\n        "Modify Dockerfile to implement USER directive"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Dependency Patching",\n      "items": [\n        "Update brace-expansion, cross-spawn, glob, and ip-address in package.json",\n        "Run npm audit fix and re-run container scans"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Critical OpenSSL vulnerabilities and High-severity security hazards detected",\n    "requirements": [\n      "Remediate all Critical vulnerabilities",\n      "Apply non-root user hardening to Dockerfile"\n    ],\n    "next_action": "Apply patches for libssl3/libcrypto3 and update vulnerable npm packages"\n  },\n  "context": {\n    "project": "sample-node-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#141",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 14:46 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 8,\n  "critical_count": 1,\n  "high_count": 7,\n  "medium_count": 0,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Container Security",\n      "problem": "Dockerfile running as root user",\n      "explanation": "The Dockerfile does not specify a non-root user, causing processes to run with root privileges inside the container, increasing the blast radius of potential compromises.",\n      "suggestion": "Add 'USER nonroot' to your Dockerfile after creating the user and group.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Blocks deployment due to security policy"\n    },\n    {\n      "id": 2,\n      "priority": "Critical",\n      "category": "Dependency Security",\n      "problem": "Critical vulnerabilities in system libraries (libcrypto3, libssl3)",\n      "explanation": "OpenSSL components are susceptible to DoS via memory growth and Heap Use-After-Free vulnerabilities.",\n      "suggestion": "Upgrade the base container image to a version containing OpenSSL 3.5.8 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Blocks deployment"\n    },\n    {\n      "id": 3,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Denial of Service in brace-expansion",\n      "explanation": "The current version of brace-expansion is vulnerable to multiple DoS attacks via memory exhaustion and exponential complexity.",\n      "suggestion": "Update dependency brace-expansion to version 5.0.9 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    },\n    {\n      "id": 4,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Regular Expression Denial of Service in cross-spawn",\n      "explanation": "The cross-spawn library contains a ReDoS vulnerability that can lead to resource exhaustion.",\n      "suggestion": "Update cross-spawn to version 7.0.5.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    },\n    {\n      "id": 5,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "Command Injection in glob",\n      "explanation": "A malicious filename can lead to command injection when processed by the current glob library version.",\n      "suggestion": "Update glob to version 11.1.0.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    },\n    {\n      "id": 6,\n      "priority": "High",\n      "category": "Dependency Security",\n      "problem": "SSRF vulnerability in ip-address",\n      "explanation": "Inconsistent parsing logic allows for SSRF and trust-boundary bypasses.",\n      "suggestion": "Update ip-address to version 10.3.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate Container Vulnerabilities",\n      "items": [\n        "Update base image to patch OpenSSL vulnerabilities",\n        "Modify Dockerfile to implement USER directive"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Dependency Patching",\n      "items": [\n        "Update brace-expansion, cross-spawn, glob, and ip-address in package.json",\n        "Run npm audit fix and re-run container scans"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "Critical OpenSSL vulnerabilities and High-severity security hazards detected",\n    "requirements": [\n      "Remediate all Critical vulnerabilities",\n      "Apply non-root user hardening to Dockerfile"\n    ],\n    "next_action": "Apply patches for libssl3/libcrypto3 and update vulnerable npm packages"\n  },\n  "context": {\n    "project": "sample-node-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#141",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 14:46 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-09-03 14:47:16.782637
52	59	PASSED	gemini-3.1-flash-lite	{\n  "total_recommendations": 3,\n  "critical_count": 0,\n  "high_count": 2,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Supply Chain",\n      "problem": "Vulnerability in msgpack library",\n      "explanation": "msgpack version 1.1.2 is vulnerable to out-of-bounds read and crash scenarios upon Unpacker reuse.",\n      "suggestion": "Upgrade msgpack to version 1.2.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Potential stability and security risk"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Supply Chain",\n      "problem": "CVE-2025-47273 in setuptools",\n      "explanation": "setuptools 70.3.0 contains a Path Traversal vulnerability that could allow arbitrary file access.",\n      "suggestion": "Update setuptools to version 78.1.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High security risk"\n    },\n    {\n      "id": 3,\n      "priority": "Medium",\n      "category": "Configuration",\n      "problem": "Hardcoded configuration in test_app.py",\n      "explanation": "The TESTING flag is hardcoded, which violates configuration management best practices and secrets handling.",\n      "suggestion": "Refactor the application to load configuration via environment variables or a secure configuration provider.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Low immediate risk, but technical debt"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate container vulnerabilities",\n      "items": [\n        "Update requirements.txt to include msgpack >= 1.2.1",\n        "Update base image or build dependencies to include setuptools >= 78.1.1"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Refactor application configuration",\n      "items": [\n        "Move hardcoded TESTING flag to an environment variable in test_app.py"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High-severity vulnerabilities identified in container dependencies.",\n    "requirements": [\n      "Upgrade msgpack to 1.2.1",\n      "Upgrade setuptools to 78.1.1"\n    ],\n    "next_action": "Apply dependency patches and trigger a new CI build."\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#147",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 21:35 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	{\n  "total_recommendations": 3,\n  "critical_count": 0,\n  "high_count": 2,\n  "medium_count": 1,\n  "low_count": 0,\n  "recommendations": [\n    {\n      "id": 1,\n      "priority": "High",\n      "category": "Supply Chain",\n      "problem": "Vulnerability in msgpack library",\n      "explanation": "msgpack version 1.1.2 is vulnerable to out-of-bounds read and crash scenarios upon Unpacker reuse.",\n      "suggestion": "Upgrade msgpack to version 1.2.1 or higher.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "Potential stability and security risk"\n    },\n    {\n      "id": 2,\n      "priority": "High",\n      "category": "Supply Chain",\n      "problem": "CVE-2025-47273 in setuptools",\n      "explanation": "setuptools 70.3.0 contains a Path Traversal vulnerability that could allow arbitrary file access.",\n      "suggestion": "Update setuptools to version 78.1.1.",\n      "relatedTool": "Trivy",\n      "deploymentImpact": "High security risk"\n    },\n    {\n      "id": 3,\n      "priority": "Medium",\n      "category": "Configuration",\n      "problem": "Hardcoded configuration in test_app.py",\n      "explanation": "The TESTING flag is hardcoded, which violates configuration management best practices and secrets handling.",\n      "suggestion": "Refactor the application to load configuration via environment variables or a secure configuration provider.",\n      "relatedTool": "Semgrep",\n      "deploymentImpact": "Low immediate risk, but technical debt"\n    }\n  ],\n  "action_steps": [\n    {\n      "step": 1,\n      "title": "Remediate container vulnerabilities",\n      "items": [\n        "Update requirements.txt to include msgpack >= 1.2.1",\n        "Update base image or build dependencies to include setuptools >= 78.1.1"\n      ]\n    },\n    {\n      "step": 2,\n      "title": "Refactor application configuration",\n      "items": [\n        "Move hardcoded TESTING flag to an environment variable in test_app.py"\n      ]\n    }\n  ],\n  "deployment_assistant": {\n    "decision": "Deployment Blocked",\n    "deployment_blocked": true,\n    "main_reason": "High-severity vulnerabilities identified in container dependencies.",\n    "requirements": [\n      "Upgrade msgpack to 1.2.1",\n      "Upgrade setuptools to 78.1.1"\n    ],\n    "next_action": "Apply dependency patches and trigger a new CI build."\n  },\n  "context": {\n    "project": "sample-python-app",\n    "branch": "main",\n    "language": "auto",\n    "build_number": "#147",\n    "ai_mode": "Security Report Interpretation",\n    "actual_model": "gemini-3.1-flash-lite",\n    "generated_at": "2026-09-03 21:35 UTC",\n    "reports_analyzed": [\n      "SAST Analysis",\n      "Dependency Audit",\n      "Container Scan"\n    ]\n  }\n}	2026-09-03 22:14:50.123616
\.


--
-- Data for Name: deployment_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deployment_results (id, pipeline_id, build_number, decision, raw_report, created_at) FROM stdin;
1	6	#19	UNKNOWN	Deployment Decision Report\nTarget environment: test\nTests: executed if enabled\nCode quality: executed if enabled\nSecurity scan: executed if enabled\nDecision: deployment allowed for test environment\n	2026-08-04 10:55:02.925872
2	5	#18	UNKNOWN	Deployment Decision Report\nTarget environment: test\nTests: executed if enabled\nCode quality: executed if enabled\nSecurity scan: executed if enabled\nDecision: deployment allowed for test environment\n	2026-08-04 10:55:21.150526
3	8	#23	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nREASON: All tests, quality, and security checks passed.\nREQUIREMENT: Tests must pass\nREQUIREMENT: Quality gate must pass\nREQUIREMENT: No critical security vulnerabilities\nNEXT_ACTION: Ready for deployment to test\n	2026-08-04 11:32:04.85244
4	9	#24	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nREASON: All tests, quality, and security checks passed.\nREQUIREMENT: Tests must pass\nREQUIREMENT: Quality gate must pass\nREQUIREMENT: No critical security vulnerabilities\nNEXT_ACTION: Ready for deployment to test\n	2026-08-04 11:46:35.671761
5	10	#25	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nREASON: All tests, quality, and security checks passed.\nREQUIREMENT: Tests must pass\nREQUIREMENT: Quality gate must pass\nREQUIREMENT: No critical security vulnerabilities\nNEXT_ACTION: Ready for deployment to test\n	2026-08-04 12:04:38.547035
6	11	#26	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nREASON: All tests, quality, and security checks passed.\nREQUIREMENT: Tests must pass\nREQUIREMENT: Quality gate must pass\nREQUIREMENT: No critical security vulnerabilities\nNEXT_ACTION: Ready for deployment to test\n	2026-08-05 22:58:25.580505
7	14	#100	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 100\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:100\nDOCKER_IMAGE: sample-python-app:100\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-30 17:22:06.083704
8	20	#106	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 106\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:106\nDOCKER_IMAGE: sample-python-app:106\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 11:39:36.197394
9	21	#107	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 107\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:107\nDOCKER_IMAGE: sample-python-app:107\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 15:24:05.233311
10	22	#108	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 108\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:108\nDOCKER_IMAGE: sample-python-app:108\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 16:39:07.704029
11	23	#109	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 109\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:109\nDOCKER_IMAGE: sample-python-app:109\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 16:51:50.508504
12	25	#111	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 111\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:111\nDOCKER_IMAGE: sample-python-app:111\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 17:15:45.434232
13	27	#113	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 113\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:113\nDOCKER_IMAGE: sample-python-app:113\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 18:25:53.996636
14	33	#119	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 119\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:119\nDOCKER_IMAGE: sample-python-app:119\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=4\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-08-31 19:59:05.062562
15	38	#124	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 124\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:124\nDOCKER_IMAGE: sample-python-app:124\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=2\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-09-01 12:29:16.027321
16	42	#129	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 129\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:129\nDOCKER_IMAGE: sample-python-app:129\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=2\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-09-01 15:40:15.983317
17	46	#133	BLOCKED	DECISION: BLOCKED\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 133\nENVIRONMENT: test\nLANGUAGE: javascript\nPROJECT: sample-node-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=0\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=1\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-node-app:133\nCONTAINER_SCAN: FAILED CRITICAL=1 HIGH=23\nSBOM: PASSED COMPONENTS=224\nREASON: Container image scan detected 1 CRITICAL vulnerability(ies) | Container image scan detected 23 HIGH vulnerability(ies) (max allowed: 4) | SAST detected 1 blocking finding(s) (HIGH/CRITICAL severity)\nNEXT_ACTION: Fix the reported issues and re-run the pipeline\n	2026-09-01 16:51:51.092333
18	51	#139	BLOCKED	DECISION: BLOCKED\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 139\nENVIRONMENT: production-simulation\nLANGUAGE: javascript\nPROJECT: sample-node-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=0\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=1\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-node-app:139\nCONTAINER_SCAN: FAILED CRITICAL=1 HIGH=23\nSBOM: PASSED COMPONENTS=224\nREASON: Container image scan detected 1 CRITICAL vulnerability(ies) | Container image scan detected 23 HIGH vulnerability(ies) (max allowed: 4) | SAST detected 1 blocking finding(s) (HIGH/CRITICAL severity)\nNEXT_ACTION: Fix the reported issues and re-run the pipeline\n	2026-09-03 14:18:15.619769
19	52	#140	BLOCKED	DECISION: BLOCKED\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 140\nENVIRONMENT: production-simulation\nLANGUAGE: javascript\nPROJECT: sample-node-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=0\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=0 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-node-app:140\nCONTAINER_SCAN: FAILED CRITICAL=1 HIGH=23\nSBOM: PASSED COMPONENTS=224\nREASON: Container image scan detected 1 CRITICAL vulnerability(ies) | Container image scan detected 23 HIGH vulnerability(ies) (max allowed: 4)\nNEXT_ACTION: Fix the reported issues and re-run the pipeline\n	2026-09-03 14:40:31.364718
20	53	#141	BLOCKED	DECISION: BLOCKED\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 141\nENVIRONMENT: test\nLANGUAGE: javascript\nPROJECT: sample-node-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=0\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=1\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-node-app:141\nCONTAINER_SCAN: FAILED CRITICAL=1 HIGH=23\nSBOM: PASSED COMPONENTS=224\nREASON: Container image scan detected 1 CRITICAL vulnerability(ies) | Container image scan detected 23 HIGH vulnerability(ies) (max allowed: 4) | SAST detected 1 blocking finding(s) (HIGH/CRITICAL severity)\nNEXT_ACTION: Fix the reported issues and re-run the pipeline\n	2026-09-03 14:47:45.794742
21	59	#147	APPROVED	DECISION: APPROVED\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 147\nENVIRONMENT: test\nLANGUAGE: python\nPROJECT: sample-python-app\nTESTS: FAILURES=0\nCODE_QUALITY: BUGS=1\nSONARQUBE_QUALITY_GATE: OK\nSAST: FINDINGS=1 BLOCKING=0\nDEPENDENCY_SCAN: PASSED VULNS=0\nSECRET_SCAN: PASSED COUNT=0\nDOCKER_BUILD: PASSED IMAGE=sample-python-app:147\nDOCKER_IMAGE: sample-python-app:147\nCONTAINER_SCAN: PASSED CRITICAL=0 HIGH=2\nSBOM: PASSED COMPONENTS=85\nREASON: All quality gates passed.\nNEXT_ACTION: Ready for deployment to test\n	2026-09-03 22:14:52.900325
\.


--
-- Data for Name: pipelines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pipelines (id, project_id, build_number, status, progress, current_stage, duration, environment, run_tests, run_quality, run_security, dependency_audit, secret_detection, generate_ai_suggestions, deploy_if_validated, created_at) FROM stdin;
44	1	#131	SUCCESS	100	Deployment Decision	2m 17s	test	t	t	t	t	f	t	t	2026-09-01 16:18:24.890432
5	1	#18	SUCCESS	100	Deployment Decision	0m 30s	test	t	t	t	t	t	t	f	2026-07-29 11:14:51.6643
4	1	#131	SUCCESS	100	Deployment Decision	2m 17s	test	t	t	t	t	t	f	f	2026-07-29 11:08:40.88621
20	1	#106	SUCCESS	100	Deployment Decision	2m 35s	test	t	t	t	t	t	t	f	2026-08-31 11:27:59.142702
6	1	#19	SUCCESS	100	Deployment Decision	0m 15s	test	t	t	t	t	t	f	f	2026-07-29 11:19:20.42563
7	1	#22	SUCCESS	100	Deployment Decision	0m 23s	test	t	t	t	t	t	f	f	2026-08-04 11:00:41.744454
56	1	#144	SUCCESS	100	Deployment Decision	3m 54s	test	t	t	t	t	t	t	f	2026-09-03 20:23:13.877247
14	1	#100	SUCCESS	100	Deployment Decision	2m 49s	test	t	t	t	t	t	f	f	2026-08-30 17:09:51.981488
36	4	#122	FAILED	100	Deployment Decision	2m 22s	test	t	t	t	t	t	t	f	2026-08-31 20:14:31.054294
28	4	#114	FAILED	100	Deployment Decision	2m 38s	test	t	t	t	t	t	t	f	2026-08-31 18:29:33.598861
8	1	#23	SUCCESS	100	Deployment Decision	0m 37s	test	t	t	t	t	t	f	f	2026-08-04 11:31:13.753428
24	1	#110	SUCCESS	100	Deployment Decision	2m 47s	test	t	t	t	t	t	t	f	2026-08-31 16:59:47.409267
22	1	#108	SUCCESS	100	Deployment Decision	2m 58s	test	t	t	t	t	t	t	f	2026-08-31 16:35:06.621281
9	1	#24	SUCCESS	100	Deployment Decision	0m 11s	test	t	t	t	t	t	f	f	2026-08-04 11:46:15.083667
10	1	#25	SUCCESS	100	Deployment Decision	0m 13s	test	t	t	t	t	t	f	f	2026-08-04 12:03:45.392798
46	5	#133	FAILED	100	Deployment Decision	0m 58s	test	t	t	t	t	t	t	t	2026-09-01 16:50:22.100654
32	4	#118	FAILED	100	Deployment Decision	2m 05s	test	t	t	t	t	t	t	t	2026-08-31 19:50:47.028149
17	1	#103	SUCCESS	100	Deployment Decision	2m 53s	test	t	t	t	t	t	t	f	2026-08-30 23:06:58.911405
11	4	#26	SUCCESS	100	Deployment Decision	0m 40s	test	t	t	t	t	t	f	f	2026-08-05 22:54:37.454508
37	5	#123	FAILED	100	Deployment Decision	0m 16s	test	t	t	t	t	t	t	t	2026-09-01 11:43:52.12097
39	4	#125	ABORTED	100	Deployment Decision	1m 44s	test	t	t	t	t	t	t	t	2026-09-01 12:39:10.387265
21	1	#107	SUCCESS	100	Deployment Decision	5m 40s	test	t	t	t	t	t	t	f	2026-08-31 15:18:03.962626
33	1	#119	SUCCESS	100	Deployment Decision	3m 26s	test	t	t	t	t	t	t	f	2026-08-31 19:55:01.380742
23	1	#109	SUCCESS	100	Deployment Decision	2m 07s	test	t	t	t	t	t	t	t	2026-08-31 16:45:52.562366
18	1	#104	SUCCESS	100	Deployment Decision	5m 06s	test	t	t	t	t	t	t	f	2026-08-30 23:47:59.716387
16	1	#102	FAILED	100	Deployment Decision	6m 24s	test	t	t	t	t	t	t	f	2026-08-30 19:31:38.908977
35	4	#121	FAILED	100	Deployment Decision	1m 52s	test	t	t	t	t	t	t	f	2026-08-31 20:11:44.01083
26	1	#112	SUCCESS	100	Deployment Decision	3m 50s	test	t	t	t	t	t	t	f	2026-08-31 17:35:00.596372
15	1	#101	SUCCESS	100	Deployment Decision	2m 07s	test	t	t	t	t	t	t	f	2026-08-30 18:27:56.08996
30	4	#116	FAILED	100	Deployment Decision	2m 31s	test	t	t	t	t	t	t	f	2026-08-31 19:21:56.953638
41	5	#127	FAILED	100	Deployment Decision	2m 00s	test	t	t	t	t	t	t	f	2026-09-01 13:59:41.352693
1	1	#128	ABORTED	100	Deployment Decision	0m 32s	Test	t	t	t	t	t	t	f	2026-07-29 10:55:23.356627
52	5	#140	FAILED	100	Deployment Decision	3m 18s	production-simulation	t	t	t	t	t	t	t	2026-09-03 14:28:33.827379
31	1	#117	SUCCESS	100	Deployment Decision	3m 46s	test	t	t	t	t	t	t	f	2026-08-31 19:25:12.282454
27	1	#113	SUCCESS	100	Deployment Decision	4m 29s	test	t	t	t	t	t	t	f	2026-08-31 18:20:43.489321
19	1	#105	SUCCESS	100	Deployment Decision	8m 23s	test	t	t	t	t	t	t	f	2026-08-31 10:44:06.593474
25	1	#111	SUCCESS	100	Deployment Decision	1m 58s	test	t	t	t	t	t	t	f	2026-08-31 17:12:17.672977
42	1	#129	SUCCESS	100	Deployment Decision	2m 31s	test	t	t	t	t	t	t	t	2026-09-01 15:36:19.319264
2	1	#129	SUCCESS	100	Deployment Decision	2m 31s	Test	t	t	t	t	t	t	f	2026-07-29 11:02:14.97948
29	1	#115	SUCCESS	100	Deployment Decision	2m 41s	test	t	t	t	t	t	t	t	2026-08-31 18:56:39.581981
48	1	#135	SUCCESS	100	Deployment Decision	1m 05s	test	t	t	t	t	t	t	f	2026-09-01 17:31:19.766926
38	1	#124	FAILED	100	Deployment Decision	10m 54s	test	t	t	t	t	t	t	t	2026-09-01 12:17:00.67801
34	4	#120	FAILED	100	Deployment Decision	1m 06s	test	t	t	t	t	t	t	t	2026-08-31 20:10:02.164392
47	1	#134	SUCCESS	100	Deployment Decision	2m 14s	test	t	t	t	t	t	t	t	2026-09-01 17:29:09.797159
45	5	#132	FAILED	100	Deployment Decision	0m 52s	test	t	t	t	t	t	t	t	2026-09-01 16:33:24.695542
51	5	#139	FAILED	100	Deployment Decision	3m 10s	production-simulation	t	t	t	t	t	t	t	2026-09-03 14:14:17.179779
40	1	#126	SUCCESS	100	Deployment Decision	3m 15s	test	t	t	t	t	t	t	t	2026-09-01 12:41:17.126054
49	5	#136	FAILED	100	Deployment Decision	2m 22s	test	t	t	t	t	t	t	t	2026-09-02 11:39:12.737205
54	1	#142	SUCCESS	100	Deployment Decision	2m 23s	test	t	t	t	t	t	t	f	2026-09-03 20:08:11.459064
43	4	#130	FAILED	100	Deployment Decision	1m 08s	test	t	t	t	t	f	t	t	2026-09-01 16:05:48.032354
3	1	#130	FAILED	100	Deployment Decision	1m 08s	staging	t	t	t	t	t	t	f	2026-07-29 11:04:09.317361
53	5	#141	FAILED	100	Deployment Decision	3m 15s	test	t	t	t	t	t	t	t	2026-09-03 14:43:30.509586
50	1	#138	SUCCESS	100	Deployment Decision	3m 23s	production-simulation	t	t	t	t	t	t	t	2026-09-03 13:47:19.89818
57	1	#145	SUCCESS	100	Deployment Decision	2m 30s	test	t	t	t	t	t	t	t	2026-09-03 21:23:24.568129
55	5	#143	FAILED	100	Deployment Decision	2m 29s	test	t	t	t	t	t	t	f	2026-09-03 20:19:44.088533
59	1	#147	SUCCESS	100	Deployment Decision	2m 44s	test	t	t	t	t	t	t	f	2026-09-03 21:32:52.041834
58	1	#146	SUCCESS	100	Deployment Decision	2m 18s	test	t	t	t	t	t	t	t	2026-09-03 21:26:59.764442
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, repository_url, branch, language, visibility, access_method, credential_id, description, last_pipeline_status, created_at) FROM stdin;
5	sample-node-app	https://gitlab.com/devsecops-pipeline-manager/sample-node-app.git	main	javascript	Private	Existing Jenkins Credential		Sample Node.js application for testing the multi-language DevSecOps pipeline.	FAILED	2026-09-01 11:43:10.431895
4	Python Calculator	https://gitlab.com/devsecops-pipeline-manager/sample-python-calculator.git	main	python	Private	Existing Jenkins Credential	gitlab-private-token	Python calculator application used to test the DevSecOps pipeline.	FAILED	2026-08-05 22:53:41.651861
1	sample-python-app	https://gitlab.com/devsecops-pipeline-manager/sample-python-app.git	main	python	Private	HTTPS Token	gitlab-private-token	Sample Python app for DevSecOps pipeline testing	SUCCESS	2026-07-29 10:47:02.468608
\.


--
-- Data for Name: quality_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quality_results (id, pipeline_id, build_number, status, issue_count, raw_report, created_at) FROM stdin;
1	6	#19	UNKNOWN	0	./app.py:12:27: W292 no newline at end of file\n./tests/test_app.py:13:30: W292 no newline at end of file\n	2026-08-04 10:55:02.897512
2	5	#18	UNKNOWN	0	./app.py:12:27: W292 no newline at end of file\n./tests/test_app.py:13:30: W292 no newline at end of file\n	2026-08-04 10:55:21.166378
3	8	#23	PASSED	2	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 2\nCOVERAGE: 82.1\nDUPLICATION: 1.5\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Python flake8 code analysis\n	2026-08-04 11:32:04.730152
4	9	#24	PASSED	2	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 2\nCOVERAGE: 82.1\nDUPLICATION: 1.5\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Python flake8 code analysis\n	2026-08-04 11:46:35.548498
5	10	#25	PASSED	2	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 2\nCOVERAGE: 82.1\nDUPLICATION: 1.5\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Python flake8 code analysis\n	2026-08-04 12:04:35.677635
6	11	#26	PASSED	2	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 2\nCOVERAGE: 82.1\nDUPLICATION: 1.5\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Python flake8 code analysis\n	2026-08-05 22:56:10.264175
7	14	#100	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-08-30 17:22:02.040056
8	20	#106	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-08-31 11:41:35.982687
9	21	#107	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-08-31 15:24:03.877474
10	22	#108	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-08-31 16:39:06.36042
11	30	#116	PASSED	2	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 2\nTOTAL_ISSUES: 2\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./calculator.py|16| W292 no newline at end of file\nISSUE|WARNING|./tests/test_calculator.py|17| W292 no newline at end of file\n	2026-08-31 19:25:05.090541
12	33	#119	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-08-31 19:59:03.672928
13	38	#124	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-09-01 12:28:56.931135
14	40	#126	PASSED	1	TOOL: flake8\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 88.5\nBUGS: 0\nCODE_SMELLS: 1\nTOTAL_ISSUES: 1\nSUMMARY: flake8 (max-line=120)\nISSUE|WARNING|./app.py|46| W292 no newline at end of file\n	2026-09-01 12:53:01.385133
15	42	#129	PASSED	0	TOOL: SonarQube\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 100.0\nBUGS: 0\nCODE_SMELLS: 0\nCOVERAGE: 100.0\nDUPLICATION: 0.0\nVULNERABILITIES: 0\nTECH_DEBT: 0\nMAINTAINABILITY: A\nSECURITY_RATING: A\nDEPLOYMENT_BLOCKED: false\nTOTAL_ISSUES: 0\nSUMMARY: SonarQube analysis completed. Quality Gate: PASSED. Bugs: 0, Code Smells: 0, Coverage: 100.0%, Duplication: 0.0%.\n	2026-09-01 15:39:52.23347
16	45	#132	PASSED	0	TOOL: SonarQube\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 90.0\nBUGS: 0\nCODE_SMELLS: 0\nCOVERAGE: 0.0\nDUPLICATION: 0.0\nVULNERABILITIES: 1\nTECH_DEBT: 0\nMAINTAINABILITY: A\nSECURITY_RATING: B\nDEPLOYMENT_BLOCKED: false\nTOTAL_ISSUES: 1\nSUMMARY: SonarQube analysis completed. Quality Gate: PASSED. Bugs: 0, Code Smells: 0, Coverage: 0.0%, Duplication: 0.0%.\n	2026-09-01 16:49:42.141113
17	46	#133	PASSED	0	TOOL: SonarQube\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 90.0\nBUGS: 0\nCODE_SMELLS: 0\nCOVERAGE: 0.0\nDUPLICATION: 0.0\nVULNERABILITIES: 1\nTECH_DEBT: 0\nMAINTAINABILITY: A\nSECURITY_RATING: B\nDEPLOYMENT_BLOCKED: false\nTOTAL_ISSUES: 1\nSUMMARY: SonarQube analysis completed. Quality Gate: PASSED. Bugs: 0, Code Smells: 0, Coverage: 0.0%, Duplication: 0.0%.\n	2026-09-01 16:51:49.174917
18	51	#139	PASSED	0	TOOL: SonarQube\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 90.0\nBUGS: 0\nCODE_SMELLS: 0\nCOVERAGE: 0.0\nDUPLICATION: 0.0\nVULNERABILITIES: 1\nTECH_DEBT: 0\nMAINTAINABILITY: A\nSECURITY_RATING: B\nDEPLOYMENT_BLOCKED: false\nTOTAL_ISSUES: 1\nSUMMARY: SonarQube analysis completed. Quality Gate: PASSED. Bugs: 0, Code Smells: 0, Coverage: 0.0%, Duplication: 0.0%.\n	2026-09-03 14:18:05.350453
19	53	#141	PASSED	0	TOOL: SonarQube\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 90.0\nBUGS: 0\nCODE_SMELLS: 0\nCOVERAGE: 0.0\nDUPLICATION: 0.0\nVULNERABILITIES: 1\nTECH_DEBT: 0\nMAINTAINABILITY: A\nSECURITY_RATING: B\nDEPLOYMENT_BLOCKED: false\nTOTAL_ISSUES: 1\nSUMMARY: SonarQube analysis completed. Quality Gate: PASSED. Bugs: 0, Code Smells: 0, Coverage: 0.0%, Duplication: 0.0%.\n	2026-09-03 14:47:48.025899
20	59	#147	PASSED	0	TOOL: SonarQube\nQUALITY_GATE: PASSED\nQUALITY_SCORE: 100.0\nBUGS: 0\nCODE_SMELLS: 0\nCOVERAGE: 100.0\nDUPLICATION: 0.0\nVULNERABILITIES: 0\nTECH_DEBT: 0\nMAINTAINABILITY: A\nSECURITY_RATING: A\nDEPLOYMENT_BLOCKED: false\nTOTAL_ISSUES: 0\nSUMMARY: SonarQube analysis completed. Quality Gate: PASSED. Bugs: 0, Code Smells: 0, Coverage: 100.0%, Duplication: 0.0%.\n	2026-09-03 22:14:54.241833
\.


--
-- Data for Name: security_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_results (id, pipeline_id, build_number, status, vulnerability_count, raw_report, created_at) FROM stdin;
1	6	#19	UNKNOWN	0		2026-08-04 10:55:02.887491
2	5	#18	UNKNOWN	0		2026-08-04 10:55:21.149985
3	8	#23	PASSED	0	STATUS: PASSED\nTOOLS: pip-audit\nCRITICAL: 0\nHIGH: 0\n0\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\n0\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Security scan completed with pip-audit\nTOOL_STATUS|pip-audit|Dependencies|PASSED|Found 0\n0 vulnerabilities\n	2026-08-04 11:32:04.795049
4	9	#24	PASSED	0	STATUS: PASSED\nTOOLS: pip-audit\nCRITICAL: 0\nHIGH: 0\n0\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\n0\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Security scan completed with pip-audit\nTOOL_STATUS|pip-audit|Dependencies|PASSED|Found 0\n0 vulnerabilities\n	2026-08-04 11:46:35.602479
5	10	#25	PASSED	0	STATUS: PASSED\nTOOLS: pip-audit\nCRITICAL: 0\nHIGH: 0\n0\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\n0\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Security scan completed with pip-audit\nTOOL_STATUS|pip-audit|Dependencies|PASSED|Found 0\n0 vulnerabilities\n	2026-08-04 12:04:38.544327
6	11	#26	PASSED	0	STATUS: PASSED\nTOOLS: pip-audit\nCRITICAL: 0\nHIGH: 0\n0\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\n0\nDEPLOYMENT_BLOCKED: false\nSUMMARY: Security scan completed with pip-audit\nTOOL_STATUS|pip-audit|Dependencies|PASSED|Found 0\n0 vulnerabilities\n	2026-08-05 22:58:25.573141
7	42	#129	WARN	2	STATUS: WARN\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 0\nHIGH: 2\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 129\nENVIRONMENT: test\nLANGUAGE: python\nSUMMARY: Security scan completed. 2 issue(s): 0 critical container, 2 high container, 0 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|PASSED|Findings: 1 total, 0 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|PASSED|Critical: 0, High: 2\n	2026-09-01 15:40:15.87216
8	45	#132	FAILED	25	STATUS: FAILED\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 1\nHIGH: 24\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 132\nENVIRONMENT: test\nLANGUAGE: javascript\nSUMMARY: Security scan completed. 25 issue(s): 1 critical container, 23 high container, 1 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|FAILED|Findings: 1 total, 1 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|FAILED|Critical: 1, High: 23\n	2026-09-01 16:49:43.653096
9	46	#133	FAILED	25	STATUS: FAILED\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 1\nHIGH: 24\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 133\nENVIRONMENT: test\nLANGUAGE: javascript\nSUMMARY: Security scan completed. 25 issue(s): 1 critical container, 23 high container, 1 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|FAILED|Findings: 1 total, 1 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|FAILED|Critical: 1, High: 23\n	2026-09-01 16:51:51.07106
10	51	#139	FAILED	25	STATUS: FAILED\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 1\nHIGH: 24\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 139\nENVIRONMENT: production-simulation\nLANGUAGE: javascript\nSUMMARY: Security scan completed. 25 issue(s): 1 critical container, 23 high container, 1 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|FAILED|Findings: 1 total, 1 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|FAILED|Critical: 1, High: 23\n	2026-09-03 14:18:15.616475
11	52	#140	FAILED	24	STATUS: FAILED\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 1\nHIGH: 23\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 140\nENVIRONMENT: production-simulation\nLANGUAGE: javascript\nSUMMARY: Security scan completed. 24 issue(s): 1 critical container, 23 high container, 0 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|PASSED|Findings: 0 total, 0 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|FAILED|Critical: 1, High: 23\n	2026-09-03 14:40:31.372772
12	53	#141	FAILED	25	STATUS: FAILED\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 1\nHIGH: 24\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: true\nBUILD_NUMBER: 141\nENVIRONMENT: test\nLANGUAGE: javascript\nSUMMARY: Security scan completed. 25 issue(s): 1 critical container, 23 high container, 1 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|FAILED|Findings: 1 total, 1 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|FAILED|Critical: 1, High: 23\n	2026-09-03 14:47:45.782406
13	59	#147	WARN	2	STATUS: WARN\nTOOLS: Semgrep, pip-audit/npm-audit/trivy, Gitleaks, Trivy-Container\nCRITICAL: 0\nHIGH: 2\nMEDIUM: 0\nLOW: 0\nSECRETS: 0\nVULNERABLE_DEPS: 0\nDEPLOYMENT_BLOCKED: false\nBUILD_NUMBER: 147\nENVIRONMENT: test\nLANGUAGE: python\nSUMMARY: Security scan completed. 2 issue(s): 0 critical container, 2 high container, 0 SAST blocking, 0 dep vulns, 0 secrets.\nTOOL_STATUS|Semgrep|SAST Analysis|PASSED|Findings: 1 total, 0 blocking\nTOOL_STATUS|pip-audit/npm-audit|Dependency Scan|PASSED|Vulnerable packages: 0\nTOOL_STATUS|Gitleaks|Secret Detection|PASSED|Secrets detected: 0\nTOOL_STATUS|Trivy|Container Scan|PASSED|Critical: 0, High: 2\n	2026-09-03 22:14:52.920973
\.


--
-- Data for Name: test_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_results (id, pipeline_id, build_number, total, passed, failed, skipped, status, raw_report, created_at) FROM stdin;
1	7	#22	3	3	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="3" time="0.009" timestamp="2026-08-04T11:00:57.982336+00:00" hostname="b0d2226c882b"><testcase classname="tests.test_app" name="test_add" time="0.000" /><testcase classname="tests.test_app" name="test_divide" time="0.000" /><testcase classname="tests.test_app" name="test_is_even" time="0.000" /></testsuite></testsuites>	2026-08-04 11:01:36.767884
2	8	#23	3	3	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="3" time="0.009" timestamp="2026-08-04T11:31:26.502705+00:00" hostname="b0d2226c882b"><testcase classname="tests.test_app" name="test_add" time="0.000" /><testcase classname="tests.test_app" name="test_divide" time="0.000" /><testcase classname="tests.test_app" name="test_is_even" time="0.000" /></testsuite></testsuites>	2026-08-04 11:32:04.675951
3	9	#24	3	3	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="3" time="0.009" timestamp="2026-08-04T11:46:26.309894+00:00" hostname="b0d2226c882b"><testcase classname="tests.test_app" name="test_add" time="0.000" /><testcase classname="tests.test_app" name="test_divide" time="0.000" /><testcase classname="tests.test_app" name="test_is_even" time="0.000" /></testsuite></testsuites>	2026-08-04 11:46:35.489392
4	10	#25	3	3	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="3" time="0.010" timestamp="2026-08-04T12:03:55.469416+00:00" hostname="b0d2226c882b"><testcase classname="tests.test_app" name="test_add" time="0.000" /><testcase classname="tests.test_app" name="test_divide" time="0.000" /><testcase classname="tests.test_app" name="test_is_even" time="0.000" /></testsuite></testsuites>	2026-08-04 12:04:27.045768
5	11	#26	4	4	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="4" time="0.027" timestamp="2026-08-05T22:54:56.554271+00:00" hostname="b0d2226c882b"><testcase classname="tests.test_calculator" name="test_add" time="0.001" /><testcase classname="tests.test_calculator" name="test_subtract" time="0.000" /><testcase classname="tests.test_calculator" name="test_multiply" time="0.000" /><testcase classname="tests.test_calculator" name="test_divide" time="0.001" /></testsuite></testsuites>	2026-08-05 22:56:03.208889
6	14	#100	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.206" timestamp="2026-08-30T17:10:06.199082+00:00" hostname="454c387baaad"><testcase classname="test_app" name="test_index_returns_200" time="0.008" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.001" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-08-30 17:22:00.817818
7	21	#107	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.245" timestamp="2026-08-31T15:18:18.908561+00:00" hostname="454c387baaad"><testcase classname="test_app" name="test_index_returns_200" time="0.007" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.001" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-08-31 15:24:00.254328
8	22	#108	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.201" timestamp="2026-08-31T16:35:25.422366+00:00" hostname="454c387baaad"><testcase classname="test_app" name="test_index_returns_200" time="0.007" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.001" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-08-31 16:39:05.640245
9	33	#119	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.171" timestamp="2026-08-31T19:55:13.436130+00:00" hostname="454c387baaad"><testcase classname="test_app" name="test_index_returns_200" time="0.006" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.001" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-08-31 19:59:21.459157
10	35	#121	4	4	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="4" time="0.036" timestamp="2026-08-31T20:11:58.088180+00:00" hostname="454c387baaad"><testcase classname="tests.test_calculator" name="test_add" time="0.001" /><testcase classname="tests.test_calculator" name="test_subtract" time="0.000" /><testcase classname="tests.test_calculator" name="test_multiply" time="0.000" /><testcase classname="tests.test_calculator" name="test_divide" time="0.000" /></testsuite></testsuites>	2026-08-31 20:14:26.648821
11	38	#124	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.188" timestamp="2026-09-01T12:17:15.815029+00:00" hostname="454c387baaad"><testcase classname="test_app" name="test_index_returns_200" time="0.006" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.001" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-09-01 12:28:46.011612
12	40	#126	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.165" timestamp="2026-09-01T12:41:38.627017+00:00" hostname="50481f9d9f8a"><testcase classname="test_app" name="test_index_returns_200" time="0.008" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.001" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-09-01 12:46:12.513073
13	42	#129	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.201" timestamp="2026-09-01T15:36:38.590328+00:00" hostname="50481f9d9f8a"><testcase classname="test_app" name="test_index_returns_200" time="0.008" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.002" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.001" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-09-01 15:39:46.261855
14	45	#132	1	1	0	0	SUCCESS	<testsuites><testsuite name="pipeline" tests="1" failures="0"><testcase classname="Pipeline" name="test_execution"></testcase></testsuite></testsuites>	2026-09-01 16:49:40.685123
15	46	#133	1	1	0	0	SUCCESS	<testsuites><testsuite name="pipeline" tests="1" failures="0"><testcase classname="Pipeline" name="test_execution"></testcase></testsuite></testsuites>	2026-09-01 16:51:46.964308
16	51	#139	1	1	0	0	SUCCESS	<testsuites><testsuite name="pipeline" tests="1" failures="0"><testcase classname="Pipeline" name="test_execution"></testcase></testsuite></testsuites>	2026-09-03 14:17:45.830434
17	53	#141	1	1	0	0	SUCCESS	<testsuites><testsuite name="pipeline" tests="1" failures="0"><testcase classname="Pipeline" name="test_execution"></testcase></testsuite></testsuites>	2026-09-03 14:47:50.509932
18	59	#147	9	9	0	0	SUCCESS	<?xml version="1.0" encoding="utf-8"?><testsuites name="pytest tests"><testsuite name="pytest" errors="0" failures="0" skipped="0" tests="9" time="0.214" timestamp="2026-09-03T21:33:09.541558+00:00" hostname="50481f9d9f8a"><testcase classname="test_app" name="test_index_returns_200" time="0.008" /><testcase classname="test_app" name="test_index_returns_message" time="0.001" /><testcase classname="test_app" name="test_health_returns_200" time="0.002" /><testcase classname="test_app" name="test_health_returns_ok" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_users_returns_list" time="0.002" /><testcase classname="test_app" name="test_get_users_has_correct_fields" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_200" time="0.001" /><testcase classname="test_app" name="test_get_status_returns_operational" time="0.001" /></testsuite></testsuites>	2026-09-03 21:38:26.869285
\.


--
-- Name: ai_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_results_id_seq', 52, true);


--
-- Name: deployment_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deployment_results_id_seq', 21, true);


--
-- Name: pipelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pipelines_id_seq', 59, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 5, true);


--
-- Name: quality_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quality_results_id_seq', 20, true);


--
-- Name: security_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.security_results_id_seq', 13, true);


--
-- Name: test_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.test_results_id_seq', 18, true);


--
-- Name: ai_results ai_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_results
    ADD CONSTRAINT ai_results_pkey PRIMARY KEY (id);


--
-- Name: deployment_results deployment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployment_results
    ADD CONSTRAINT deployment_results_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: quality_results quality_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_results
    ADD CONSTRAINT quality_results_pkey PRIMARY KEY (id);


--
-- Name: security_results security_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_results
    ADD CONSTRAINT security_results_pkey PRIMARY KEY (id);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- Name: ix_ai_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_results_id ON public.ai_results USING btree (id);


--
-- Name: ix_ai_results_pipeline_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ai_results_pipeline_id ON public.ai_results USING btree (pipeline_id);


--
-- Name: ix_deployment_results_build_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deployment_results_build_number ON public.deployment_results USING btree (build_number);


--
-- Name: ix_deployment_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deployment_results_id ON public.deployment_results USING btree (id);


--
-- Name: ix_deployment_results_pipeline_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_deployment_results_pipeline_id ON public.deployment_results USING btree (pipeline_id);


--
-- Name: ix_pipelines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pipelines_id ON public.pipelines USING btree (id);


--
-- Name: ix_projects_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_id ON public.projects USING btree (id);


--
-- Name: ix_quality_results_build_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_quality_results_build_number ON public.quality_results USING btree (build_number);


--
-- Name: ix_quality_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_quality_results_id ON public.quality_results USING btree (id);


--
-- Name: ix_quality_results_pipeline_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_quality_results_pipeline_id ON public.quality_results USING btree (pipeline_id);


--
-- Name: ix_security_results_build_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_security_results_build_number ON public.security_results USING btree (build_number);


--
-- Name: ix_security_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_security_results_id ON public.security_results USING btree (id);


--
-- Name: ix_security_results_pipeline_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_security_results_pipeline_id ON public.security_results USING btree (pipeline_id);


--
-- Name: ix_test_results_build_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_test_results_build_number ON public.test_results USING btree (build_number);


--
-- Name: ix_test_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_test_results_id ON public.test_results USING btree (id);


--
-- Name: ix_test_results_pipeline_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_test_results_pipeline_id ON public.test_results USING btree (pipeline_id);


--
-- Name: ai_results ai_results_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_results
    ADD CONSTRAINT ai_results_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: deployment_results deployment_results_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployment_results
    ADD CONSTRAINT deployment_results_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: quality_results quality_results_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_results
    ADD CONSTRAINT quality_results_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: security_results security_results_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_results
    ADD CONSTRAINT security_results_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: test_results test_results_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zrXjju9oXMi9KSPf8It0l4f6fobxhmn8j25AvlnfJY7Tn5htBRuLxQwucYP2Oqt

