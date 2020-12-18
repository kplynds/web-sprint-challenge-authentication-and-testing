// Write your tests here
const request = require("supertest");
const server = require("./server");
const db = require("../data/dbConfig");
const { as } = require("../data/dbConfig");

const User = { username: "kyle", password: "password" };

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("users").truncate();
});
afterAll(async () => {
  await db.destroy();
});

describe("endpoints", () => {
  describe("[POST] /api/auth/register", () => {
    it("returns new user object with id and username", async () => {
      const res = await request(server).post("/api/auth/register").send(User);
      expect(res.body.id).toBe(1);
      expect(res.body.username).toBe("kyle");
    });
    it('responds with "username taken" when user is already in db', async () => {
      await request(server).post("/api/auth/register").send(User);
      const res = await request(server).post("/api/auth/register").send(User);
      expect(JSON.stringify(res.body)).toMatch(/username taken/);
    });
  });
  describe("[POST] /api/auth/login", () => {
    it("logs in a user and returns a message", async () => {
      await request(server).post("/api/auth/register").send(User);
      const res = await request(server).post("/api/auth/login").send(User);
      expect(JSON.stringify(res.body.message)).toMatch(/welcome, kyle/);
    });
    it("will not accept an empty login", async () => {
      const res = await request(server).post("/api/auth/login").send();
      expect(JSON.stringify(res.body)).toMatch(
        /username and password required/
      );
    });
  });
  describe("[GET] /api/jokes", () => {
    it ("will not return jokes without a token", async () => {
      await db("users").insert(User);
      const res = await request(server).get("/api/jokes");
      expect(JSON.stringify(res.body)).toMatch(/token required/)
    })
    it ("gets jokes when token exists", async () => {
      await request(server).post("/api/auth/register").send(User);
      const login = await request(server).post("/api/auth/login").send(User);
      const res = await request(server).get("/api/jokes").set('Authorization', `${login.body.token}`);
      expect(res.text).toMatch(/Did you hear about the guy whose whole left side was cut off/);
    })
  })
});
