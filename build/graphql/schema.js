import { makeExecutableSchema } from 'graphql-tools';
import { resolvers } from './resolvers';
import gql from 'graphql-tag';
const typeDefs = gql`
    type Note {
        _id: ID!
        title: String!
        date: Date
        content: String!
    }
    scalar Date

    type Query {
        allNotes: [Note]
    }
`;
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});
export default schema;