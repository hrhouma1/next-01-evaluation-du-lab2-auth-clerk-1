# 12 - Faites une recherche et donne des exemples concrets (avec sources) d’entreprises ou de projets qui utilisent NextAuth, Clerk ou une solution JWT “maison”. Complète la question avec des cas d’usage réels et des références vérifiables.

- Réponse :

### Exemples vérifiés (avec sources)

| Approche                                    | Exemples d’entreprises / projets                                                                                                                                           | Indice de preuve                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **NextAuth.js**                             | **Cal.com** (outil de prise de rendez-vous, open-source) – le dépôt et l’image Docker montrent des variables `NEXTAUTH_URL`/erreurs NextAuth ⇒ usage direct. ([GitHub][1]) | Docs & issues GitHub publics.         |
|                                             | **Dub.co** (link management) – leur dépôt de docs contient une page `next-auth.mdx`; d’autres dépôts mentionnent NextAuth. ([GitHub][2])                                   | Fichiers et PR publics.               |
|                                             | **Sites détectés par Wappalyzer** (ex. **leonardo.ai**, **10015.io**, etc.) listés comme utilisant NextAuth. ([wappalyzer.com][3])                                         | Détection technologique (Wappalyzer). |
| **Clerk (Auth-as-a-Service)**               | **Trading Experts** – étude de cas officielle expliquant la mise en place de Clerk pour l’auth et la gestion d’utilisateurs. ([Clerk][4])                                  | Case study Clerk.                     |
|                                             | **Turso, Inngest, BaseHub** – Clerk indique que ces boîtes utilisent/leur font confiance pour du Next.js auth. ([Clerk][5])                                                | Page produit Clerk (Next.js auth).    |
|                                             | **Témoignage Vercel (CEO Guillermo Rauch)** sur la page d’accueil de Clerk (endorsement/usage). ([Clerk][6])                                                               | Témoignage officiel sur clerk.com.    |
| **JWT “maison”** (tokens signés sur mesure) | **GitHub Apps** – auth des apps via **JWT** pour obtenir des tokens d’installation. ([GitHub Docs][7])                                                                     | Docs GitHub officielles.              |
|                                             | **Shopify Apps embarquées** – **session tokens** au format **JWT** pour les apps dans l’Admin. ([Shopify][8])                                                              | Docs Shopify officielles.             |
|                                             | **Atlassian (Jira/Confluence) – Connect Apps** – authentification des apps via **JWT**. ([developer.atlassian.com][9])                                                     | Docs Atlassian officielles.           |
|                                             | **Kubernetes** – **service account tokens** basés sur **JWT** (usage plateforme). ([Kubernetes][10])                                                                       | Docs Kubernetes.                      |

### Remarques rapides

* Pour **NextAuth**, on trouve surtout des **preuves publiques** dans des dépôts OSS (Cal.com) + des **listes de détection** (Wappalyzer) pour les sites en prod. ([GitHub][1], [wappalyzer.com][3])
* Pour **Clerk**, les **case studies et témoignages** viennent du site officiel, et leurs pages produits listent des logos/clients (Turso, Inngest, BaseHub, etc.). ([Clerk][4])
* Pour **JWT**, j’ai privilégié des **docs primaires** (GitHub, Shopify, Atlassian, Kubernetes) qui détaillent explicitement l’usage des JWT en production. ([GitHub Docs][7], [Shopify][8], [developer.atlassian.com][9], [Kubernetes][10])


- [1]: https://github.com/calcom/docker?utm_source=chatgpt.com "calcom/docker"
- [2]: https://github.com/dubinc/docs?utm_source=chatgpt.com "dubinc/docs: Official docs for Dub.co"
- [3]: https://www.wappalyzer.com/technologies/authentication/nextauth-js/?utm_source=chatgpt.com "Websites using NextAuth.js"
- [4]: https://clerk.com/blog/trading-experts?utm_source=chatgpt.com "Trading Experts | Case Study"
- [5]: https://clerk.com/nextjs-authentication?utm_source=chatgpt.com "Next.js Authentication - Best Auth Middleware for your ..."
- [6]: https://clerk.com/?utm_source=chatgpt.com "Clerk | Authentication and User Management"
- [7]: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app?utm_source=chatgpt.com "Generating a JSON Web Token (JWT) for a GitHub App"
[8]: https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens?utm_source=chatgpt.com "About session tokens"
- [9]: https://developer.atlassian.com/cloud/jira/platform/understanding-jwt-for-connect-apps/?utm_source=chatgpt.com "Understanding JWT for Connect apps"
- [10]: https://kubernetes.io/docs/concepts/security/service-accounts/?utm_source=chatgpt.com "Service Accounts"  
