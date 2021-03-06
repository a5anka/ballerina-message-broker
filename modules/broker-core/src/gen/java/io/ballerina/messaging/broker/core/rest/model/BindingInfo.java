/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

package io.ballerina.messaging.broker.core.rest.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;

import java.util.Objects;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;


public class BindingInfo   {
  
  private @Valid String bindingPattern = null;
  private @Valid String queueName = null;
  private @Valid String filterExpression = null;

  /**
   * Routing pattern of the binding
   **/
  public BindingInfo bindingPattern(String bindingPattern) {
    this.bindingPattern = bindingPattern;
    return this;
  }

  
  @ApiModelProperty(required = true, value = "Routing pattern of the binding")
  @JsonProperty("bindingPattern")
  @NotNull
  public String getBindingPattern() {
    return bindingPattern;
  }
  public void setBindingPattern(String bindingPattern) {
    this.bindingPattern = bindingPattern;
  }

  /**
   * Bound queue name
   **/
  public BindingInfo queueName(String queueName) {
    this.queueName = queueName;
    return this;
  }

  
  @ApiModelProperty(value = "Bound queue name")
  @JsonProperty("queueName")
  public String getQueueName() {
    return queueName;
  }
  public void setQueueName(String queueName) {
    this.queueName = queueName;
  }

  /**
   * message filtering expression
   **/
  public BindingInfo filterExpression(String filterExpression) {
    this.filterExpression = filterExpression;
    return this;
  }

  
  @ApiModelProperty(value = "message filtering expression")
  @JsonProperty("filterExpression")
  public String getFilterExpression() {
    return filterExpression;
  }
  public void setFilterExpression(String filterExpression) {
    this.filterExpression = filterExpression;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    BindingInfo bindingInfo = (BindingInfo) o;
    return Objects.equals(bindingPattern, bindingInfo.bindingPattern) &&
        Objects.equals(queueName, bindingInfo.queueName) &&
        Objects.equals(filterExpression, bindingInfo.filterExpression);
  }

  @Override
  public int hashCode() {
    return Objects.hash(bindingPattern, queueName, filterExpression);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class BindingInfo {\n");

    sb.append("    bindingPattern: ").append(toIndentedString(bindingPattern)).append("\n");
    sb.append("    queueName: ").append(toIndentedString(queueName)).append("\n");
    sb.append("    filterExpression: ").append(toIndentedString(filterExpression)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}

