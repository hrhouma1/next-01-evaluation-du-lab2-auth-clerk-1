# 11 - Qui utilise NextAuth, Clerk ou une solution JWT maison ? Peux-tu donner des exemples de compagnies, leur taille et pourquoi elles ont choisi cette approche ?

- Réponse :

### Tableau comparatif (Exemples de compagnies)

| Approche                      | Exemples de compagnies / projets                                                                                                                                                | Taille estimée                        | Raisons du choix                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NextAuth.js** (open-source) | - **Hashnode** (plateforme de blogs tech)<br>- **Cal.com** (alternative open-source à Calendly)<br>- **Dub.co** (URL shortener SaaS)<br>- Plusieurs SaaS Next.js sur GitHub     | Startups (10–100 employés)            | - Gratuit et open-source<br>- Forte intégration Next.js<br>- Contrôle sur la DB (Prisma, Postgres)<br>- Bon compromis pour SaaS early-stage        |
| **Clerk** (Auth-as-a-Service) | - **Highlight.io** (observabilité frontend)<br>- **Resend** (API d’emails)<br>- **Startups YC / Vercel showcase** (SaaS early stage)<br>- **Hashnode AI Labs** (expérimental)   | Startups / scale-ups (5–200 employés) | - UI prête à l’emploi (sign-in, MFA)<br>- Gain de temps pour lancer vite<br>- Support B2B (organisations, rôles)<br>- Moins de maintenance interne |
| **JWT maison (custom auth)**  | - **Netflix** (streaming global)<br>- **Uber** (ride-sharing mondial)<br>- **Stripe** (API paiements)<br>- **Airbnb** (plateforme mondiale)<br>- Banques / Santé / Gouvernement | Grandes entreprises (1000+ employés)  | - Besoin de sécurité extrême<br>- Microservices distribués<br>- Conformité (PCI, HIPAA, GDPR)<br>- Contrôle total sur tokens & infra               |


### Lecture rapide

* **NextAuth** → petits / moyens SaaS **Next.js-first** (open-source ou startup).
* **Clerk** → startups SaaS qui veulent aller vite sans réinventer la roue.
* **JWT maison** → grandes entreprises ou secteurs régulés où l’auth = cœur de la sécurité.




