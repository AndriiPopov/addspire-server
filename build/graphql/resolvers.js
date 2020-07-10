import Account from '../models/account';
export const resolvers = {
  Query: {
    async allNotes() {
      return await Note.find();
    }

  }
};