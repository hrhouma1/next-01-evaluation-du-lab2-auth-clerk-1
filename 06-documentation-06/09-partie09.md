# 09 - Est-ce que Clerk en mode headless est payant ?

- Réponse :

### Détails importants

* **Mode headless = gratuit** → Tu peux utiliser les hooks (`useUser`, `useSignIn`, `useSession`) et les API de Clerk dans le plan **Free** (jusqu’à **10 000 utilisateurs actifs mensuels**).
* Tu crées ton propre UI (React, Tailwind, MUI…) → Clerk ne fait que la gestion en arrière-plan.
* Pas de frais cachés : que tu utilises leur UI prête à l’emploi ou le mode headless, c’est **inclus dans le même plan**.


### Quand ça devient payant

* Si tu dépasses **10k MAUs**, tu passes au plan **Pro (25 \$/mois)** puis **0,02 \$/utilisateur supplémentaire**.
* Si tu veux des **options avancées** (MFA enrichi, impersonation, B2B avancé), il faut prendre des **add-ons** payants (\~100 \$/mois chacun).



### **Résumé :**

* **Headless UI = gratuit**, inclus dans Clerk Free.
* Tu payes seulement si ton app **dépasse 10k utilisateurs actifs** ou si tu veux des modules avancés.
