# Est-ce que Clerk fournit une base de données pour mon application (ex : produits, panier) ?


- Est-ce que Clerk fournit une base de données pour mon application (ex : produits, panier) ?

- Réponse :
Clerk **ne fournit pas une base de données générale** (comme un panier d’achats ou un catalogue de produits). C’est une **plateforme d’authentification et de gestion d’utilisateurs**, pas une base de données e-commerce.


### 1. Ce que Clerk fournit vraiment

* Une **base orientée utilisateurs** : profils, emails, mots de passe hashés, OAuth (Google, GitHub, etc.), gestion des sessions, MFA, organisations B2B, rôles, etc.
* Une API et un SDK pour accéder à ces données utilisateurs depuis ton application.
* Des fonctionnalités de sécurité prêtes à l’emploi (vérification email/SMS, gestion de session, sign-in/sign-up UI).

En gros : tu n’as pas à coder toi-même la logique d’authentification + stockage utilisateurs. Clerk s’occupe de la **User Database**.



### 2. Ce que Clerk **ne fournit pas**

* Pas de **base de données produits** (par exemple ton catalogue e-commerce).
* Pas de **gestion de panier ou de commandes**.
* Pas de **système transactionnel**.

Ces données restent dans ta propre base (Postgres, MySQL, MongoDB, Supabase, Firebase, etc.).



### 3. Architecture typique

Dans une appli e-commerce tu auras en fait deux bases **différentes** :

* **Base Clerk (Users/Orgs)**

  * Identité, login, rôles, permissions.
  * Exemple : `user_id = 123`.

* **Ta base métier (Produits, Panier, Commandes)**

  * Catalogue de produits, stock, prix, panier.
  * Liée aux utilisateurs via `user_id`.
  * Exemple : table `orders` → clé étrangère `user_id` venant de Clerk.



✅ Conclusion :
Clerk **gère les utilisateurs et leur authentification**, mais pour ton **panier** et ta **base produits**, tu dois les stocker toi-même (ou via un backend type Prisma + Postgres, Supabase, etc.). Clerk ne les fournit pas.
