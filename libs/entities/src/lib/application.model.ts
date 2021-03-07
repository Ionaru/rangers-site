import { Entity } from 'typeorm';

import { BaseModel } from './base.model';

@Entity({
    name: 'application',
})
export class ApplicationModel extends BaseModel {

}
