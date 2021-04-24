const request = require('supertest');
const app = require('../index.js');

describe('Test the root path', () =>{
    test('It should response the GET method', async()=>{
        try {
            const resp = await request(app).get('/')
            expect(resp.statusCode).toBe(200)
        } catch(e){
            throw e
        }
    });
});
describe('Test the login path', () =>{
    test('It should response the GET method', async()=>{
        try {
            const resp = await request(app).get('/logowanie')
            expect(resp.statusCode).toBe(200)
        } catch(e){
            throw e
        }
    });
});
describe('Test the register path', () =>{
    test('It should response the GET method', async()=>{
        try {
            const resp = await request(app).get('/rejestracja')
            expect(resp.statusCode).toBe(200)
        } catch(e){
            throw e
        }
    });
});

const {MongoClient} = require('mongodb');
describe('Test the database insert, update and delete command', () => {
    let connection;
    let db;


    beforeAll(async () => {
        connection = await MongoClient.connect('mongodb+srv://yoda:yoda@cluster0.g2qbi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        db = await connection.db(global.mongoose);
    });


    it('should insert into collection', async () => {
        try{
            const users = db.collection('users');

            const mockUser = {_id: '17', name: 'John'};
            await users.insertOne(mockUser);

            const insertedUser = await users.findOne({_id: '17'});
            expect(insertedUser).toEqual(mockUser);
        } catch(e){
            throw(e)
        }
    });

    it('should find into collection', async () => {
        try{
            const users = db.collection('users');
            const mockUser = {_id: '17', name: 'John'};
            const insertedUser = await users.findOne({_id: '17'});
            expect(insertedUser).toEqual(mockUser);
        } catch(e){
            throw(e)
        }
    });
    it('should update collection', async () => {
        try{
            const users = db.collection('users');
            const mockUser = {_id: '17', name: 'John'};
            var oldName = {_id: '17', name: 'John'}
            var newName = {_id: '17', name: 'Janek'};
            await db.collection('users').updateOne(oldName, {$set:newName}, function(err, res){
                if(err) throw err;
            });

            const updatedUser = await users.findOne({name: 'Janek' });
            expect(updatedUser).toEqual(Object(newName));
        } catch(e){
            throw(e)
        }
    });
    it('should delete user from collection', async () => {
        try{
            const users = db.collection('users');
            const mockUser = {_id: '17', name: 'Janek'};
            await users.deleteOne(mockUser);

            const deletedUser = await users.findOne({_id: '17'});
            expect(deletedUser).toBeNull()
        } catch(e){
            throw(e)
        }
    });
    afterAll(() => {
        connection.disconnect()

    });
});
