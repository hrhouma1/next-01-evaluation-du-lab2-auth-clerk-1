# Clerk peut-il servir à faire du marketing (newsletters, campagnes email) ?

- Réponse :
Non, Clerk **n’est pas un outil de marketing**.
Clerk est spécialisé dans **l’authentification et la gestion des utilisateurs** (login, sign-up, SSO, MFA, gestion d’organisations B2B, etc.), mais **pas dans l’envoi de newsletters ou de campagnes marketing**.



### Ce que Clerk peut faire (utile pour ton app)

* Stocker les profils utilisateurs (emails, téléphone, métadonnées).
* Vérifier et sécuriser l’accès (MFA, sessions, rôles).
* Fournir des webhooks / API → tu peux connecter ton CRM ou ton outil marketing.
* Gérer l’opt-in email (par ex. case à cocher “recevoir des infos”).



### Ce que Clerk **ne fait pas**

* Pas de gestion de campagnes d’email marketing.
* Pas de segmentation clients.
* Pas de suivi analytics marketing.
* Pas de templates de newsletters ou tracking d’ouverture.



### Comment compléter Clerk

Si tu veux faire des **campagnes marketing**, tu dois brancher Clerk avec un outil dédié :

* **SendGrid**, **Postmark**, **Amazon SES** → pour l’email transactionnel.
* **Mailchimp**, **Brevo (Sendinblue)**, **Klaviyo**, **HubSpot** → pour newsletters, automation marketing.



- Clerk **sécurise et gère les utilisateurs**, mais pour les **campagnes marketing** tu dois utiliser un autre service spécialisé et connecter les deux.

