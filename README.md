# Hoppy Hunting - Server

## Summary

This is a brewery app that will allow users to save breweries that they want to try. 
Users are required to sign up to create a brewery list. 
Users can log out and sign back in to update the breweries that are saved. 
Comments are optional. Rating can be updated after the brewery is added. 
Users can delete the brewery. 

## Technology Used

- Node.js
- Express
- Postgres
  
### Testing

- Mocha
- Chai
- Supertest
  
## API

### Auth
#### POST /api/login
#### POST /api/signup

### Breweries
#### GET /api/breweries
#### POST /api/breweries
#### GET /api/breweries/:brewery_id
#### DELETE /api/breweries/:brewery_id
#### PATCH /api/breweries/:brewery_id


## Live App

https://hoppy-hunting.vercel.app/

## Client Repository

https://github.com/ckeefe90/Hoppy-Hunting-Client

