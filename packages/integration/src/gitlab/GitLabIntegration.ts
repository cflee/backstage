/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import parseGitUrl from 'git-url-parse';
import { defaultScmResolveUrl } from '../helpers';
import { ScmIntegration, ScmIntegrationsFactory } from '../types';
import {
  GitLabIntegrationConfig,
  readGitLabIntegrationConfigs,
} from './config';

/**
 * A GitLab based integration.
 *
 * @public
 */
export class GitLabIntegration implements ScmIntegration {
  static factory: ScmIntegrationsFactory<GitLabIntegration> = ({ config }) => {
    const configs = readGitLabIntegrationConfigs(
      config.getOptionalConfigArray('integrations.gitlab') ?? [],
    );
    const integrations = configs.map(c => new GitLabIntegration(c));
    return {
      list: () => integrations,
      byUrl: url => integrations.find(i => i.isUrlApplicable(url)),
      byHost: host => integrations.find(i => i.config.host === host),
    };
  };

  constructor(private readonly integrationConfig: GitLabIntegrationConfig) {}

  get type(): string {
    return 'gitlab';
  }

  get title(): string {
    const { host, group } = this.integrationConfig;
    return group ? `${host}/${group}` : host;
  }

  get config(): GitLabIntegrationConfig {
    return this.integrationConfig;
  }

  resolveUrl(options: {
    url: string;
    base: string;
    lineNumber?: number;
  }): string {
    return defaultScmResolveUrl(options);
  }

  resolveEditUrl(url: string): string {
    return replaceGitLabUrlType(url, 'edit');
  }

  isUrlApplicable(url: string | URL): boolean {
    const parsedUrl = parseGitUrl(url instanceof URL ? url.toString() : url);
    if (this.config.host !== parsedUrl.resource) {
      return false;
    }
    return parsedUrl.full_name.startsWith(this.config.group);
  }
}

/**
 * Takes a GitLab URL and replaces the type part (blob, tree etc).
 *
 * @param url - The original URL
 * @param type - The desired type, e.g. 'blob', 'tree', 'edit'
 * @public
 */
export function replaceGitLabUrlType(
  url: string,
  type: 'blob' | 'tree' | 'edit',
): string {
  return url.replace(/\/\-\/(blob|tree|edit)\//, `/-/${type}/`);
}
