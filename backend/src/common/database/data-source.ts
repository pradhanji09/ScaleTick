import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join, resolve } from 'path';

config({ path: resolve(process.cwd(), '../.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../../../migrations/*{.ts,.js}')],

  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
