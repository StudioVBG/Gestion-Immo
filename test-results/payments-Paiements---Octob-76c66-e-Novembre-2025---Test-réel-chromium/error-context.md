# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation
  - main [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Connexion" [level=3] [ref=e7]
        - paragraph [ref=e8]: Connectez-vous à votre compte
      - generic [ref=e10]:
        - generic [ref=e11]:
          - text: Email
          - textbox "Email" [ref=e12]:
            - /placeholder: votre@email.com
        - generic [ref=e13]:
          - text: Mot de passe
          - generic [ref=e14]:
            - textbox "Mot de passe" [ref=e15]
            - button "Afficher le mot de passe" [ref=e16]:
              - img [ref=e17]
              - text: Afficher le mot de passe
        - button "Se connecter" [ref=e20]
  - region "Notifications (F8)":
    - list
```