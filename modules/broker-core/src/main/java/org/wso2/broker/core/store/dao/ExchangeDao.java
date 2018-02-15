/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
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
 *
 */

package org.wso2.broker.core.store.dao;

import org.wso2.broker.core.BrokerException;
import org.wso2.broker.core.Exchange;

/**
 * Defines functionality required at persistence layer for managing {@link Exchange}s.
 */
public interface ExchangeDao {

    void persist(Exchange exchange) throws BrokerException;

    void delete(Exchange exchange) throws BrokerException;

    void retrieveAll(ExchangeCollector exchangeCollector) throws BrokerException;

    /**
     * Interface used as a callback when retrieving exchanges from the database. Callback is invoked per each exchange
     * retrieved from the database.
     */
    @FunctionalInterface
    interface ExchangeCollector {

        void addExchange(String name, String typeString) throws BrokerException;
    }

}