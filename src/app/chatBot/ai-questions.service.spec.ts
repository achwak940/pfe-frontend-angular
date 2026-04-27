import { TestBed } from '@angular/core/testing';

import { AiQuestionsService } from './ai-questions.service';

describe('AiQuestionsService', () => {
  let service: AiQuestionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiQuestionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
