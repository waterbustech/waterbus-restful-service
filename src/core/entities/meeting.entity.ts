import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from '../../utils/entity-helper';
import bcrypt from 'bcryptjs';
import { Participant } from './participant.entity';
import { Transform } from 'class-transformer';

@Entity({ name: 'meetings' })
export class Meeting extends EntityHelper {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Meeting with Kai' })
  @Column({ type: String })
  title: string;

  @ApiProperty()
  @Transform(({ value }) => undefined)
  @Column({ type: String })
  password: string;

  @OneToMany(() => Participant, (participant) => participant.meeting, {
    eager: true,
    cascade: true,
  })
  users: Participant[];

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Column({ type: Number })
  code: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @BeforeInsert()
  async generateCode() {
    this.code = Math.floor(10000000 + Math.random() * 90000000);
  }
}
