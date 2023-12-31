import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { User } from '../../core/entities/user.entity';
import { Session } from '../../core/entities/session.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtRefreshPayloadType } from 'src/utils/strategies/types/jwt-refresh-payload.type';
import { UnauthorizedException } from '@nestjs/common';

const mockUserRepositoryFactory = jest.fn(() => ({
  // Change here from findOne to findOneBy
  findOneBy: jest.fn((entity) => entity),
  findEmail: jest.fn((entity) => entity),
}));
const mockSessionRepositoryFactory = jest.fn(() => ({
  // Change here from findOne to findOneBy
  findOneBy: jest.fn((entity) => entity),
  findEmail: jest.fn((entity) => entity),
}));

describe('AuthService', () => {
  let authService: AuthService;
  // let jwtService: JwtService;
  let usersService: UsersService;
  let sessionService: SessionService;
  // let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        UsersService,
        SessionService,
        ConfigService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepositoryFactory,
        },
        {
          provide: getRepositoryToken(Session),
          useFactory: mockSessionRepositoryFactory,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    // jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
    sessionService = module.get<SessionService>(SessionService);
    // configService = module.get<ConfigService>(ConfigService);
  });

  describe('loginWithSocial', () => {
    it('should create a new user, session, and return tokens', async () => {
      // Mock User entity
      const mUser: User = {
        id: 1,
        fullName: 'Kai Dao',
        userName: 'kaidao123',
        googleId: 'google123',
        facebookId: 'facebook123',
        appleId: 'apple123',
        avatar: 'https://waterbus.cloud/assets/avatar/lambiengcode',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        generateUserName: jest.fn(),
        setEntityName: jest.fn(),
        toJSON: jest.fn(),
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
        participant: null,
      };

      const mSession: Session = {
        id: 0,
        user: mUser,
        createdAt: undefined,
        deletedAt: undefined,
        setEntityName: jest.fn(),
        toJSON: jest.fn(),
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      };
      const mToken = 'mockToken';
      const mRefreshToken = 'mockRefreshToken';
      const mTokenExpires = Date.now() + 3600; // Provide the token expiration time

      // Mock service methods
      jest.spyOn(usersService, 'create').mockResolvedValueOnce(mUser);
      jest.spyOn(sessionService, 'create').mockResolvedValueOnce(mSession);
      jest.spyOn(authService, 'getTokensData').mockResolvedValueOnce({
        token: 'mockToken',
        refreshToken: 'mockRefreshToken',
        tokenExpires: mTokenExpires,
      });

      // Invoke the method
      const result = await authService.loginWithSocial(mUser);

      // Assertion
      expect(result).toEqual({
        refreshToken: mRefreshToken,
        token: mToken,
        tokenExpires: mTokenExpires,
        user: mUser,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh the tokens', async () => {
      // Mock data
      const data: JwtRefreshPayloadType = {
        sessionId: 0,
        iat: 0,
        exp: 0,
      };
      const mSession: Session = {
        id: 0,
        user: new User(),
        createdAt: undefined,
        deletedAt: undefined,
        setEntityName: jest.fn(),
        toJSON: jest.fn(),
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      };

      const mToken = 'mockToken';
      const mRefreshToken = 'mockRefreshToken';
      const mTokenExpires = Date.now() + 3600; // Provide the token expiration time

      // Mock service methods
      jest.spyOn(sessionService, 'findOne').mockResolvedValueOnce(mSession);
      jest.spyOn(authService, 'getTokensData').mockResolvedValueOnce({
        token: mToken,
        refreshToken: mRefreshToken,
        tokenExpires: mTokenExpires,
      });

      // Invoke the method
      const result = await authService.refreshToken(data);

      // Assertion
      expect(result).toEqual({
        token: mToken,
        refreshToken: mRefreshToken,
        tokenExpires: mTokenExpires,
      });
    });

    it('should throw UnauthorizedException if session is not found', async () => {
      // Mock data
      const data: JwtRefreshPayloadType = {
        sessionId: 0,
        iat: 0,
        exp: 0,
      };

      // Mock service methods
      jest.spyOn(sessionService, 'findOne').mockResolvedValueOnce(null);

      // Invoke the method
      await expect(authService.refreshToken(data)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
