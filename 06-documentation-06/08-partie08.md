# 08 - Oui 👍 tu peux **personnaliser l’UI** de ton application avec **Clerk**, mais il y a deux niveaux à comprendre :

- Réponse :

### 1. Les composants prêts à l’emploi (Plug & Play UI)

Clerk fournit des **composants UI intégrés** pour le sign-in / sign-up / profil utilisateur :

* `<SignIn />`, `<SignUp />`, `<UserProfile />`, `<OrganizationProfile />`…
* Ils gèrent déjà : formulaires, validations, OTP, OAuth, MFA.

👉 **Personnalisation possible :**

* Couleurs, polices, logos, images.
* Textes et labels (traductions incluses).
* Mode clair/sombre.
* Style via thèmes (CSS variables).

⚠️ Mais ces composants restent **dans un cadre défini par Clerk** (tu ne modifies pas toute la structure HTML).


### 2. L’UI totalement custom (Headless mode)

Clerk offre aussi une API **headless** → tu n’utilises pas leur UI, mais tu construis la tienne avec ton propre design.

* Tu appelles les hooks / SDK (`useUser`, `useSignIn`, `useSession`) pour gérer auth.
* Tu fais ton propre formulaire avec **React, Tailwind, MUI…**
* Clerk gère la sécurité, mais l’UI est 100% la tienne.

**Exemple concret :**

* Tu veux un écran de login qui ressemble à **Airbnb** → tu crées ton formulaire Tailwind, et tu connectes les fonctions Clerk pour gérer la logique (login, OTP, SSO).


### 3. Cas concrets de personnalisation

* **SaaS rapide** → tu prends leur UI “clé en main”, tu changes couleurs/logo pour rester cohérent.
* **Application très brandée** → tu passes en mode headless, et tu construis ton identité visuelle complète (comme si Clerk était “invisible”).


### Conclusion
Oui, tu peux personnaliser.

* **Simple** → thèmes sur l’UI de Clerk.
* **Avancé** → mode headless = UI 100% sur mesure avec ton style.
