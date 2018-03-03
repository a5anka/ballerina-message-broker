/**
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the 'License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint max-len: 0 */
import 'brace';
import _ from 'lodash';
import { invokeTryIt, getTryItUrl } from 'api-client/api-client';
import cn from 'classnames';
import AceEditor from 'react-ace';
import { Container, Grid, Form, Item, Button, Message, Divider, Segment, Input, Icon, Select } from 'semantic-ui-react';
import copy from 'copy-to-clipboard';
import PropTypes from 'prop-types';
import React from 'react';
import ServiceTreeNode from 'plugins/ballerina/model/tree/service-node';
import uuid from 'uuid/v4';
import 'brace/mode/json';
import 'brace/mode/xml';
import 'brace/mode/html';
import 'brace/theme/monokai';

import './http-client.scss';

const CONTENT_TYPES = [
    'text/css',
    'text/csv',
    'text/html',
    'application/json',
    'application/xml',
];

/**
 * Http try-it client component
 * @class HttpClient
 * @extends {React.Component}
 */
class HttpClient extends React.Component {

    /**
     * Creates an instance of HttpClient.
     * @param {Object} props React properites.
     * @memberof HttpClient
     */
    constructor(props) {
        super(props);
        this.state = {
            httpMethod: 'GET',
            httpMethods: this.getHttpMethods(),
            baseUrl: 'localhost:9090',
            appendUrl: this.compileURL(),
            contentType: '',
            responseBody: '',
            responseCode: '',
            responseHeaders: '',
            responseHttpMethod: '',
            requestUrl: '',
            requestBody: '',
            requestHeaders: [],
            returnedRequestHeaders: '',
            timeConsumed: '0',
            waitingForResponse: false,
            selectedService: undefined,
            selectedResource: undefined,
            showCopyUrlNotification: false,
        };

        this.onAddNewHeader = this.onAddNewHeader.bind(this);
        this.onAppendUrlChange = this.onAppendUrlChange.bind(this);
        this.onContentTypeChange = this.onContentTypeChange.bind(this);
        this.onContentTypeSelected = this.onContentTypeSelected.bind(this);
        this.onHeaderDelete = this.onHeaderDelete.bind(this);
        this.onHeaderKeyChange = this.onHeaderKeyChange.bind(this);
        this.onHeaderValueChange = this.onHeaderValueChange.bind(this);
        this.onHeaderValueKeyDown = this.onHeaderValueKeyDown.bind(this);
        this.onHttpMethodChanged = this.onHttpMethodChanged.bind(this);
        this.onHttpMethodSelected = this.onHttpMethodSelected.bind(this);
        this.onInvoke = this.onInvoke.bind(this);
        this.onInvokeCancel = this.onInvokeCancel.bind(this);
        this.onRequestBodyChange = this.onRequestBodyChange.bind(this);
        this.onServiceSelected = this.onServiceSelected.bind(this);
        this.onResourceSelected = this.onResourceSelected.bind(this);
        this.renderInputComponent = this.renderInputComponent.bind(this);

        this.headerKey = undefined;
        this.focusOnHeaderKey = false;
    }

    /**
     * On component is mount for the first time.
     * @memberof HttpClient
     */
    componentDidMount() {
        getTryItUrl()
            .then((baseUrl) => {
                this.setState({
                    baseUrl,
                });
            }).catch(() => {
            });
        this.onAddNewHeader(false);
    }

    /**
     * On new props are recieved.
     * @param {Object} nextProps Properties
     * @memberof HttpClient
     */
    componentWillReceiveProps(nextProps) {
        if (nextProps.serviceNodes.length > 0) {
            let selectedService;
            let selectedResource;
            let selectedContentType = '';
            if (nextProps.serviceNodes.length === 1) {
                selectedService = nextProps.serviceNodes[0];
                if (selectedService.getResources().length === 1) {
                    selectedResource = selectedService.getResources()[0];
                    if (selectedResource.getConsumeTypes().length === 1) {
                        selectedContentType = selectedResource.getConsumeTypes()[0];
                    }
                }
            }
            this.setState({
                selectedService,
                selectedResource,
                appendUrl: this.compileURL(selectedResource),
                contentType: selectedContentType,
            });
        }
    }

    /**
     * On component did update event.
     * @memberof HttpClient
     */
    componentDidUpdate() {
        if (this.headerKey && this.focusOnHeaderKey) {
            this.headerKey.focus();
        }
        this.focusOnHeaderKey = false;
    }

    /**
     * Event handler when a new header is added.
     * @param {boolean} [focus=true] True to focus on empty header key.
     * @memberof HttpClient
     */
    onAddNewHeader(focus = true) {
        const emptyHeaderIndex = this.state.requestHeaders.findIndex((header) => {
            return header.key.trim() === '' && header.value.trim() === '';
        });

        if (emptyHeaderIndex === -1) {
            this.setState({
                requestHeaders: [...this.state.requestHeaders, { id: uuid(), key: '', value: '' }],
            });
        }

        if (focus === true) {
            this.focusOnHeaderKey = true;
            if (this.headerKey) {
                this.headerKey.focus();
            }
        }
    }

    /**
     * Event handler when the url path is changed.
     * @param {Object} event The change event.
     * @memberof HttpClient
     */
    onAppendUrlChange(event) {
        this.setState({
            appendUrl: event.target.value,
        });
    }

    /**
     * Event handler when the content type text box is changed.
     * @param {Event} event The change event.
     * @memberof HttpClient
     */
    onContentTypeChange(event, data) {
        this.setState({
            contentType: data.value,
        });
    }

    /**
     * Event handler on content type is selected.
     * @param {any} event The event
     * @param {any} suggestionValue The selected value.
     * @memberof HttpClient
     */
    onContentTypeSelected(event, { suggestionValue }) {
        this.setState({
            contentType: suggestionValue,
        });
    }

    /**
     * Event handler when a header is deleted/removed.
     * @param {string} headerKey They key or the name of the header.
     * @memberof HttpClient
     */
    onHeaderDelete(headerKey) {
        const newHeaders = this.state.requestHeaders.filter((header) => {
            return header.key !== headerKey;
        });
        this.setState({
            requestHeaders: newHeaders,
        });
    }

    /**
     * Event handler when the name or key of the header is changed.
     * @param {string} headerValue Value of the header.
     * @param {Object} event The change event.
     * @memberof HttpClient
     */
    onHeaderKeyChange(headerValue, event) {
        const headerClone = JSON.parse(JSON.stringify(this.state.requestHeaders));
        headerClone.forEach((header, index, headers) => {
            if (header.id === event.target.id) {
                headers[index].key = event.target.value;
            }
        });

        this.setState({
            requestHeaders: headerClone,
        }, function () {
            if (headerClone[headerClone.length - 1].value === '' && headerClone[headerClone.length - 1].key !== '') {
                this.onAddNewHeader(false);
            }
        });
    }

    /**
     * Event handler when the value of the header is changed.
     * @param {string} headerKey The name or key of the header.
     * @param {Object} event The change event.
     * @memberof HttpClient
     */
    onHeaderValueChange(headerKey, event) {
        const headerClone = JSON.parse(JSON.stringify(this.state.requestHeaders));
        headerClone.forEach((header, index, headers) => {
            if (header.id === event.currentTarget.id) {
                headers[index].value = event.currentTarget.value;
            }
        });

        this.setState({
            requestHeaders: headerClone,
        });
    }

    /**
     * Event handler when a key is pressed in a header value.
     * @param {Object} e The keypress event.
     * @memberof HttpClient
     */
    onHeaderValueKeyDown(e) {
        if (e.charCode === 13 || e.key === 'Enter') {
            this.onAddNewHeader(true);
        }
    }

    /**
     * Event handler when the body of the request is changed.
     * @param {string} newValue The new content.
     * @memberof HttpClient
     */
    onRequestBodyChange(newValue) {
        this.setState({
            requestBody: newValue,
        });
    }

    /**
     * Event handler when the http method is changed in the textbox.
     * @param {Object} event The change event.
     * @memberof HttpClient
     */
    onHttpMethodChanged(event) {
        this.setState({
            httpMethod: event.target.value,
        });
    }

    /**
     * Event handler when an http method is selected.
     * @param {Object} event The select event.
     * @param {string} suggestionValue The selected value.
     * @memberof HttpClient
     */
    onHttpMethodSelected(event, { suggestionValue }) {
        this.setState({
            httpMethod: suggestionValue,
        });
    }

    /**
     * Event handler when a request is sent.
     * @memberof HttpClient
     */
    onInvoke() {
        this.setState({
            waitingForResponse: true,
        });
        const tryItPayload = _.cloneDeep(this.state);
        delete tryItPayload.selectedService;
        delete tryItPayload.selectedResource;
        invokeTryIt(tryItPayload, 'http')
            .then((response) => {
                if (this.state.waitingForResponse === true) {
                    this.setState({
                        requestUrl: response.requestUrl,
                        responseCode: response.responseCode,
                        responseHeaders: JSON.stringify(response.responseHeaders, null, 2),
                        responseHttpMethod: this.state.httpMethod,
                        responseBody: response.responseBody,
                        returnedRequestHeaders: JSON.stringify(response.returnedRequestHeaders, null, 2),
                        timeConsumed: response.timeConsumed,
                        waitingForResponse: false,
                    });
                }
            }).catch(() => {
                if (this.state.waitingForResponse === true) {
                    this.context.alert.showError(`Unexpected error occurred while sending request.
                                                Make sure you have entered valid request details.`);
                }
                this.setState({
                    waitingForResponse: false,
                });
            });
    }

    /**
     * Event handler for cancelling the request.
     * @memberof HttpClient
     */
    onInvokeCancel() {
        this.setState({
            waitingForResponse: false,
        });
    }

    /**
     * Event handler when a service is selected.
     * @param {string} eventKey The selected value.
     * @param {Object} event The select event.
     * @memberof HttpClient
     */
    onServiceSelected(event, data) {
        this.setState({
            selectedService: data.value,
            selectedResource: undefined,
        });
    }

    /**
     * Event handler when a resource is selected.
     * @param {string} value The selected resource node.
     * @memberof HttpClient
     */
    onResourceSelected(event, { value }) {
        const appendUrl = this.compileURL(value);
        let contentType = '';
        if (value.getConsumeTypes().length === 1) {
            contentType = value.getConsumeTypes()[0];
        }
        this.setState({
            selectedResource: value,
            appendUrl,
            httpMethods: this.getHttpMethods(value),
            contentType,
        });
    }

    /**
     * Gets the supported HTTP methods.
     * @param {ResourceNode} resourceNode The resource node.
     * @returns {string[]} Http methods.
     * @memberof HttpClient
     */
    getHttpMethods() {
        return [
            { text: 'GET', value: 'GET' },
            { text: 'POST', value: 'POST' },
            { text: 'DELETE', value: 'DELETE' },
            { text: 'PUT', value: 'PUT' },
            { text: 'OPTIONS', value: 'OPTIONS' },
            { text: 'HEAD', value: 'HEAD' },
        ];
    }

    /**
     * Gets the mode for the ace editor depending on content type.
     * @returns {string} ace mode.
     * @memberof HttpClient
     */
    getRequestBodyMode() {
        if (this.state.contentType.includes('json')) {
            return 'json';
        } else if (this.state.contentType.includes('xml')) {
            return 'xml';
        } else {
            return 'text';
        }
    }

    /**
     * Gets the mode for the ace editor depending on accept header in the request.
     * @returns {string} ace mode.
     * @memberof HttpClient
     */
    getResponseBodyMode() {
        if (this.state.returnedRequestHeaders) {
            const requestHeaders = JSON.parse(this.state.returnedRequestHeaders);
            const mimeType = requestHeaders.Accept;
            if (mimeType) {
                if (mimeType.includes('json')) {
                    return 'json';
                } else if (mimeType.includes('xml')) {
                    return 'xml';
                } else if (mimeType.includes('html')) {
                    return 'html';
                }
            } else {
                const responseHeaders = JSON.parse(this.state.responseHeaders);
                const contentType = responseHeaders['Content-Type'];
                if (contentType.includes('json')) {
                    return 'json';
                } else if (contentType.includes('xml')) {
                    return 'xml';
                } else if (contentType.includes('html')) {
                    return 'html';
                }
            }
        }

        return 'text';
    }

    /**
     * Gets the css class depending on the status code.
     * @param {string} httpCode The http code.
     * @returns {string} The name of the css class.
     * @memberof HttpClient
     */
    getStatusCodeClass(httpCode) {
        if (/1\d\d\b/g.test(httpCode)) {
            return 'http-status-code-1__';
        } else if (/2\d\d\b/g.test(httpCode)) {
            return 'http-status-code-2__';
        } else if (/3\d\d\b/g.test(httpCode)) {
            return 'http-status-code-3__';
        } else if (/4\d\d\b/g.test(httpCode)) {
            return 'http-status-code-4__';
        } else if (/5\d\d\b/g.test(httpCode)) {
            return 'http-status-code-5__';
        }
        return '';
    }

    /**
     * Gets the url for invoking a resrouce.
     * @param {ResourceNode} resourceNode The resourceNode.
     * @returns {string} The url.
     * @memberof HttpClient
     */
    compileURL(resourceNode) {
        let url = '/';
        if (resourceNode !== undefined) {
            url = resourceNode.compileURL();
        }

        return url;
    }

    /**
     * Renders the view of the headers.
     * @returns {ReactElement} The view of the headers.
     * @memberof HttpClient
     */
    renderHeaders() {
        return this.state.requestHeaders.map((header, index) => {
            let removeButton;
            // Remove button is not included for new header fields
            if (index !== this.state.requestHeaders.length - 1) {
                removeButton = <i className='fw fw-delete' onClick={() => this.onHeaderDelete(header.key)} />;
            }
            return (<div key={`${header.id}`}>
                <input
                    id={header.id}
                    key={`key-${header.id}`}
                    ref={(ref) => {
                        if (header.key === '' && header.value === '') {
                            this.headerKey = ref;
                        }
                    }}
                    placeholder='Key'
                    type='text'
                    className='request-header-input form-control'
                    value={header.key}
                    onChange={e => this.onHeaderKeyChange(header.key, e)}
                    onBlur={() => { this.focusTarget = undefined; }}
                />
                :
                <input
                    id={header.id}
                    key={`value-${header.id}`}
                    placeholder='Value'
                    type='text'
                    className='request-header-input form-control'
                    defaultValue={header.value}
                    onChange={e => this.onHeaderValueChange(header.value, e)}
                    onBlur={() => { this.focusTarget = undefined; }}
                    onKeyDown={this.onHeaderValueKeyDown}
                />
                {removeButton}
            </div>);
        });
    }

    /**
     * Renders the input view of the http method selection dropdown's input box.
     * @param {any} inputProps The input properties.
     * @returns {React.Element} The view.
     * @memberof HttpClient
     */
    renderInputComponent(inputProps) {
        return (<div className='inputContainer'>
            <input {...inputProps} />
            <i
                className='fw fw-down'
                onClick={(e) => {
                    e.currentTarget.previousElementSibling.focus();
                }}
            />
        </div>);
    }

    /**
     * Rendering the services dropdown.
     * @returns {React.Element} The dropdown view.
     * @memberof HttpClient
     */
    renderServicesDropdown() {
        const serviceItems = this.props.serviceNodes.map((serviceNode) => {
            return ({
                key: serviceNode.getID(),
                text: serviceNode.getName().getValue(),
                value: serviceNode,
            });
        });

        const defaultValue = this.state.selectedService;
        return (
            <Form.Field>
                <Select
                    search
                    selection
                    placeholder='Select Service'
                    options={serviceItems}
                    value={this.state.selectedService}
                    onChange={this.onServiceSelected}
                    defaultValue={defaultValue}
                />
            </Form.Field>
        );
    }

    /**
     * Rendering the resource dropdown.
     * @returns {React.Element} The dropdown view.
     * @memberof HttpClient
     */
    renderResourcesDropdown() {
        let resourceItems = [];
        if (this.state.selectedService) {
            resourceItems = this.state.selectedService.getResources().map((resourceNode) => {
                return ({
                    key: resourceNode.getID(),
                    text: resourceNode.getName().getValue(),
                    value: resourceNode,
                });
            });
        }

        const defaultValue = this.state.selectedResource;

        return (
            <Select
                search
                selection
                placeholder='Select Resource'
                options={resourceItems}
                value={this.state.selectedResource}
                onChange={this.onResourceSelected}
                defaultValue={defaultValue}
            />
        );
    }

    /**
     * Renders the service and resource selection component;
     * @returns {ReactElement} The view.
     * @memberof HttpClient
     */
    renderMainControlComponent() {
        if (this.props.serviceNodes.length > 0) {
            const httpBaseUrl = `http://${this.state.baseUrl}`;
            const sendOrCancelButton = this.renderSendOrCancelButton();

            // Getting service name views
            const servicesDropdown = this.renderServicesDropdown();
            const resourceDropdown = this.renderResourcesDropdown();
            return (
                <Segment
                    className='http-client-main-wrapper'
                    inverted
                >
                    <Form
                        inverted
                        widths='equal'
                    >
                        <Form.Group inline>
                            <Form.Field >
                                <Form.Select
                                    search
                                    selection
                                    options={this.state.httpMethods}
                                    onChange={this.onHttpMethodChanged}
                                    defaultValue={this.state.httpMethod}
                                />
                            </Form.Field>
                            <Form.Field>
                                <label style={{ fontSize: 16 }} htmlFor='service'>
                                    {httpBaseUrl}
                                    <span className='url-separator'> / </span>
                                </label>
                            </Form.Field>
                            {servicesDropdown}
                            <Form.Field >
                                {resourceDropdown}
                            </Form.Field>
                        </Form.Group>
                        <Form.Group>
                            <Form.Field>
                                <Form.Input type='text' action>
                                    <Input
                                        label={`${httpBaseUrl} / `}
                                        value={this.state.appendUrl}
                                        onChange={this.onAppendUrlChange}
                                    />
                                    {sendOrCancelButton}
                                    <Button
                                        title='Copy URL'
                                        onClick={() => {
                                            copy(`${httpBaseUrl}${this.state.appendUrl}`);
                                        }}
                                    >
                                        <Icon name='copy' />
                                    </Button>
                                </Form.Input>
                            </Form.Field>

                        </Form.Group>
                    </Form>
                </Segment>);
        } else {
            return (null);
        }
    }

    /**
     * Renders the send and cancel based on 'waitingForResponse' state.
     * @returns {ReactElement} The button view.
     * @memberof HttpClient
     */
    renderSendOrCancelButton() {
        if (this.state.waitingForResponse === false) {
            return (<Button primary className='send-request' onClick={this.onInvoke} >Send</Button>);
        } else {
            return (<Button primary className='cancel-request' onClick={this.onInvokeCancel} >
                <i className='fw fw-loader5 fw-spin fw-1x' />
                <span>Cancel</span>
            </Button>);
        }
    }

    /**
     * Rendering the request headers.
     * @returns {ReactElement[]} The request header views.
     * @memberof HttpClient
     */
    renderRequestHeaders() {
        return this.state.requestHeaders.map((header) => {
            return ([
                (<Form.Field key={`${header.id}`} width={7}>
                    <input
                        key={`key-${header.id}`}
                        ref={(ref) => {
                            if (header.key === '' && header.value === '') {
                                this.headerKey = ref;
                            }
                        }}
                        placeholder='Key'
                        type='text'
                        className='header-input form-control'
                        defaultValue={header.key}
                        onChange={e => this.onHeaderKeyChange(header.value, e)}
                        onBlur={() => { this.focusTarget = undefined; }}
                    />
                </Form.Field>),
                (<Form.Field width={7}>
                    <input
                        key={`value-${header.id}`}
                        placeholder='Value'
                        type='text'
                        className='header-input form-control'
                        initialValue={header.value}
                        onChange={e => this.onHeaderValueChange(header.key, e)}
                        onBlur={() => { this.focusTarget = undefined; }}
                        onKeyDown={this.onHeaderValueKeyDown}
                    />
                </Form.Field>),
                (<Form.Field width={2}>
                    <Button
                        onClick={() => this.onHeaderDelete(header.key)}
                    >
                        <Icon name='trash' style={{ margin: 0 }} />
                    </Button>
                </Form.Field>)]);
        });
    }

    /**
     * Rendering dropdown for content types.
     * @returns {React.Element} The dropdown view.
     * @memberof HttpClient
     */
    renderContentTypes() {
        let contentTypes = CONTENT_TYPES;
        if (this.state.selectedResource && this.state.selectedResource.getConsumeTypes().length > 0) {
            contentTypes = this.state.selectedResource.getConsumeTypes();
        }
        const contentTypesItems = contentTypes.map(type => ({ key: type, text: type, value: type }));
        return (
            <Form.Select
                search
                selection
                options={contentTypesItems}
                value={this.state.contentType}
                onChange={this.onContentTypeChange}
                defaultValue={this.state.contentType}
                placeholder='Content Type'
            />
        );
    }

    /**
     * Renders the view of the http client.
     * @returns {ReactElement} The view.
     * @memberof HttpClient
     */
    render() {
        const requestHeaders = this.renderRequestHeaders();
        const mainControlComponent = this.renderMainControlComponent();
        const contentTypesControl = this.renderContentTypes();
        return (
            <Container fluid>
                {mainControlComponent}
                <Grid>
                    <Grid.Row className='http-client-wrapper'>
                        <Grid.Column width={8}>
                            <Item.Group>
                                <Item>
                                    <div className='http-client-request'>
                                        <Item.Content>
                                            <Segment inverted>
                                                <Item.Header >Request</Item.Header>
                                                <Divider />
                                                <Form>
                                                    <Form.Group inline>
                                                        <label htmlFor='content-types'>Content-Type</label>
                                                        {contentTypesControl}
                                                    </Form.Group>
                                                    <Form.Group>
                                                        <Form.Field width={16}>
                                                            <span className='section-header'>Headers</span>
                                                            <Divider />
                                                            <div className='current-headers'>
                                                                <Form.Group width={16}>
                                                                    {requestHeaders}
                                                                </Form.Group>
                                                            </div>
                                                        </Form.Field>
                                                    </Form.Group>
                                                    <Form.Group>
                                                        <Form.Field className='http-client-body-wrapper'>
                                                            <label htmlFor='http-body'>Body</label>
                                                            <Divider />
                                                            <div className='ACE-editor-wrapper'>
                                                                <AceEditor
                                                                    mode={this.getRequestBodyMode()}
                                                                    theme='monokai'
                                                                    onChange={this.onRequestBodyChange}
                                                                    value={this.state.requestBody}
                                                                    name='RequestBody'
                                                                    editorProps={{
                                                                        $blockScrolling: Infinity,
                                                                    }}
                                                                    setOptions={{
                                                                        showLineNumbers: false,
                                                                    }}
                                                                    maxLines={Infinity}
                                                                    minLines={10}
                                                                    width='auto'
                                                                    showPrintMargin={false}
                                                                />
                                                            </div>
                                                        </Form.Field>
                                                    </Form.Group>
                                                </Form>
                                            </Segment>
                                        </Item.Content>
                                    </div>
                                </Item>
                            </Item.Group>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Item.Group>
                                <Item>
                                    <div className='http-client-request'>
                                        <Item.Content>
                                            <Segment inverted>
                                                <Item.Header >Response</Item.Header>
                                                <Divider />
                                                <Form>
                                                    <Form.Group>
                                                        <Form.Field className='http-client-response-attributes'>
                                                            <strong>Request URL :
                                                                <span
                                                                    className={cn('attribute-value',
                                                                        this.getStatusCodeClass(this.state.responseCode))}
                                                                >
                                                                    {this.state.requestUrl}
                                                                </span>
                                                            </strong>
                                                            <strong>Reponse Code :
                                                                <span
                                                                    className={cn('attribute-value',
                                                                        this.getStatusCodeClass(
                                                                            this.state.responseCode))}
                                                                >
                                                                    {this.state.responseCode}
                                                                </span>
                                                            </strong>
                                                            <strong>Request HTTP Method :
                                                                <span
                                                                    className={cn('attribute-value',
                                                                        this.getStatusCodeClass(
                                                                            this.state.responseCode))}
                                                                >
                                                                    {this.state.responseHttpMethod}
                                                                </span>
                                                            </strong>
                                                            <strong>Time Consumed :
                                                                <span
                                                                    className={cn('attribute-value',
                                                                        this.getStatusCodeClass(
                                                                            this.state.responseCode))}
                                                                >
                                                                    {this.state.timeConsumed} ms
                                                                </span>
                                                            </strong>
                                                        </Form.Field>
                                                    </Form.Group>
                                                    <Form.Group>
                                                        <Form.Field className='http-client-response-content'>
                                                            <div className='header-wrapper'>
                                                                <div className='header-title section-header'>
                                                                    Headers
                                                                </div>
                                                                <div className='header-content'>
                                                                    <div
                                                                        className='response-headers'
                                                                    >
                                                                        <span
                                                                            className='response-header-title'
                                                                        >
                                                                            Response Headers
                                                                        </span>
                                                                        {this.state.responseHeaders.length > 0 ? (
                                                                            <div>
                                                                                {
                                                                                    Object.entries(JSON.parse(this.state.responseHeaders)).map(([key, value]) => {
                                                                                        return (<div className='header-attribute' key={`response-${key}`}>
                                                                                            <div className='key'>{key}</div>
                                                                                            :
                                                                                            <div className='value'>{value}</div>
                                                                                        </div>);
                                                                                    })}
                                                                            </div>
                                                                        ) : (
                                                                            <Message
                                                                                warning
                                                                                list={[
                                                                                    'Hit the send button to see the headers.',
                                                                                ]}
                                                                            />
                                                                            )}

                                                                    </div>
                                                                    <div className='request-headers'>
                                                                        <span className='request-headers-title'>Request Headers</span>
                                                                        {this.state.returnedRequestHeaders.length > 0 ? (
                                                                            <div>
                                                                                {
                                                                                    Object.entries(JSON.parse(this.state.returnedRequestHeaders)).map(([key, value]) => {
                                                                                        return (<div className='header-attribute' key={`returned-request-${key}`}>
                                                                                            <div className='key'>{key}</div>
                                                                                            :
                                                                                            <div className='value'>{value}</div>
                                                                                        </div>);
                                                                                    })}
                                                                            </div>
                                                                        ) : (
                                                                            <Message
                                                                                warning
                                                                                list={[
                                                                                    'Hit the send button to see the headers.',
                                                                                ]}
                                                                            />
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Form.Field>
                                                    </Form.Group>
                                                    <Form.Group>
                                                        <Form.Field className='http-client-response-attributes'>
                                                            <label htmlFor='body-content'>Body</label>
                                                            <Divider />
                                                            <div className='body-content'>
                                                                <AceEditor
                                                                    mode={this.getResponseBodyMode()}
                                                                    theme='monokai'
                                                                    name='ResponseBody'
                                                                    value={this.state.responseBody}
                                                                    editorProps={{
                                                                        $blockScrolling: Infinity,
                                                                    }}
                                                                    setOptions={{
                                                                        showLineNumbers: false,
                                                                    }}
                                                                    maxLines={Infinity}
                                                                    minLines={10}
                                                                    readOnly
                                                                    width='auto'
                                                                    showPrintMargin={false}
                                                                />
                                                            </div>
                                                        </Form.Field>
                                                    </Form.Group>
                                                </Form>
                                            </Segment>
                                        </Item.Content>
                                    </div>
                                </Item>
                            </Item.Group>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Container>);
    }
}

HttpClient.propTypes = {
    serviceNodes: PropTypes.arrayOf(PropTypes.instanceOf(ServiceTreeNode)),
};

HttpClient.defaultProps = {
    serviceNodes: [],
};

HttpClient.contextTypes = {
    alert: PropTypes.shape({
        showInfo: PropTypes.func,
        showSuccess: PropTypes.func,
        showWarning: PropTypes.func,
        showError: PropTypes.func,
    }).isRequired,
};

export default HttpClient;