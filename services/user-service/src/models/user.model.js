import { EntitySchema } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      default: () => uuidv4(),
    },
    username: {
      type: 'varchar',
      length: 64,
      unique: true,
    },
    email: {
      type: 'varchar',
      length: 255,
      unique: true,
    },
    passwordHash: {
      type: 'varchar',
      length: 255,
    },
    firstName: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    lastName: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    role: {
      type: 'varchar',
      length: 20,
      default: 'USER',
    },
    isActive: {
      type: 'boolean',
      default: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
});
