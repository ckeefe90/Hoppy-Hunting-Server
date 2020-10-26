CREATE TYPE star_rating AS ENUM ('1', '2', '3', '4', '5');

CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE breweries (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    comments TEXT NOT NULL,
    rating star_rating,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

