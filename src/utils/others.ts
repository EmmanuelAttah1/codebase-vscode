import * as crypto from 'crypto';

export const calculateHash=(text: string): string => {
    return crypto.createHash('md5').update(text).digest('hex');
};