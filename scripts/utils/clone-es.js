/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict'

const { accessSync, mkdirSync } = require('fs')
const { join } = require('path')
const Git = require('simple-git')

const esRepo = 'https://github.com/opensearch-project/opensearch-js.git'
const esFolder = join(__dirname, '..', '..', 'elasticsearch')
const apiFolder = join(esFolder, 'rest-api-spec', 'src', 'main', 'resources', 'rest-api-spec', 'api')

function cloneAndCheckout (opts, callback) {
  const { log, tag, branch } = opts
  withTag(tag, callback)

  /**
   * Sets the elasticsearch repository to the given tag.
   * If the repository is not present in `esFolder` it will
   * clone the repository and the checkout the tag.
   * If the repository is already present but it cannot checkout to
   * the given tag, it will perform a pull and then try again.
   * @param {string} tag
   * @param {function} callback
   */
  function withTag (tag, callback) {
    let fresh = false
    let retry = 0

    if (!pathExist(esFolder)) {
      if (!createFolder(esFolder)) {
        log.fail('Failed folder creation')
        return
      }
      fresh = true
    }

    const git = Git(esFolder)

    if (fresh) {
      clone(checkout)
    } else if (opts.branch) {
      checkout(true)
    } else {
      checkout()
    }

    function checkout (alsoPull = false) {
      if (branch) {
        log.text = `Checking out branch '${branch}'`
      } else {
        log.text = `Checking out tag '${tag}'`
      }
      git.checkout(branch || tag, err => {
        if (err) {
          if (retry++ > 0) {
            callback(new Error(`Cannot checkout tag '${tag}'`), { apiFolder })
            return
          }
          return pull(checkout)
        }
        if (alsoPull) {
          return pull(checkout)
        }
        callback(null, { apiFolder })
      })
    }

    function pull (cb) {
      log.text = 'Pulling elasticsearch repository...'
      git.pull(err => {
        if (err) {
          callback(err, { apiFolder })
          return
        }
        cb()
      })
    }

    function clone (cb) {
      log.text = 'Cloning elasticsearch repository...'
      git.clone(esRepo, esFolder, err => {
        if (err) {
          callback(err, { apiFolder })
          return
        }
        cb()
      })
    }
  }

  /**
   * Checks if the given path exists
   * @param {string} path
   * @returns {boolean} true if exists, false if not
   */
  function pathExist (path) {
    try {
      accessSync(path)
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Creates the given folder
   * @param {string} name
   * @returns {boolean} true on success, false on failure
   */
  function createFolder (name) {
    try {
      mkdirSync(name)
      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = cloneAndCheckout
