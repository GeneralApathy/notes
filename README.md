# Notes
I tuoi appunti, ovunque tu voglia.
Benvenuto nella documentazione ufficiale di [Notes](https://appunti.emilianomaccaferri.com).
Qui troverai una guida su come utilizzare la RestAPI di cui è dotata la web app.

----
## Endpoint
L'endpoint della RestAPI è *(temporaneamente)* `https://appunti.emilianomaccaferri.com/api`.

__N.B__: Sarà necessario utilizzare, oltre ai dovuti parametri, un __user agent__ per autenticare tutte le richieste.

---
## Metodi della RestAPI
La RestAPI è un'applicazione promise-based programmata in Node.js, il codice di quest'ultima è disponibile all'interno di questa stessa repository.

Ogni metodo sarà così strutturato:
### `<tipo di richiesta> /nome`
- `nome parametro`: \<tipo di dato\>, \<descrizione\>, [opzionale]

\<risposta\>

---

### `POST /login`

- `username`: String, l'username con il quale l'utente si è registrato.
- `password`: String, la password usata alla registrazione.

<b>Successo</b><br>
In caso di successo, la RestAPI risponderà nel seguente modo:<br>
```
{
	success: true,
    sessionid: "UJnb9IqafK5gItR9AEFL67RBPxzb427oNauTuAAJ3UAQ6XL8HlrVx7ATBk3BnPjz",
    username: "macca",
    id: "ZW0cYxvzhWYf8SqXOZb2SwxWE3mgEEw4JhFJoCXbOXpeW0HDkwKY56Snsz3SCWyD",
    mail: "inbox@emilianomaccaferri.com",
    verified: 1
}
```

<b> Errori </b>
- Username inesistente `404`
	```
	{
	    error: "does_not_exist"
	}
	```
- Password errata `404`

	```	
	{
		error: "invalid_password"
	}
	```

----

### `POST /register`

- `username`: String, username che verrà usato al login.
- `password`: String, password che verrà usata al login.
- `email`: String, email che verrà usata per confermare l'account e per comunicazioni.
