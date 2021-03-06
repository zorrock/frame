
'use strict';
import config from '../../data/config.json';
import React, { Component } from "react";
import PropTypes, { shape } from 'prop-types';
import {setState, getState} from '../../utils/session-state';
import {
  Row, Col, Layout, Menu, Breadcrumb,
  Icon, Button, Switch, Dropdown, message,
  Tooltip, Select, Drawer, Radio, Collapse, List,
  Divider, Form, Input
  } from 'antd';

import { EditorState, ContentState, convertFromRaw, convertToRaw, convertFromHTML } from 'draft-js';

import Visualizer from '../Visualizer/Visualizer';

import { Wrapper, Tab, TabList, TabPanel} from 'react-aria-tabpanel';

import ReactJson from 'react-json-view';
// import DOMify from 'react-domify';

import saveToDB from '../../utils/save-db';
import getFromDB from '../../utils/load-db';
import openDB from '../../utils/create-db';
import traverseEntriesById from '../../utils/entries-traversal';
import replaceEntry from '../../utils/replace-entry';

import './AskMain.scss';

const { TextArea } = Input;

/** Data library / source vars */
const savedSettings = config.savedSettings;
const pythonNLPServer = config.savedSettings.NLPServer;
const defaultFLib = savedSettings.defaultLibrary;

export default class AskMain extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      passageAnswer: "The answer will be here",
      _isMounted: false,
    };
  }
  
  componentDidMount() {
    this.setState({_isMounted: true});
  }

  componentWillUnount() {
    this.setState({_isMounted: false});
  }


  handleSubmit = (e) => {
    const _this = this;
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (err) {
        this.props.updateAppMethod();
      } else {
        // console.log('Received values of form: ', values);
        message.info("Asking Frame..");
        this.props.form.resetFields();
        fetch("http://localhost:80/api/make_predict", {
          method: "POST",
          mode: 'cors',
          body: JSON.stringify(values),
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
                    },
          credentials: "same-origin"
        }).then(function(response) {
          return response.json()
        })
        .then(function(jsonRes) {
         message.success("The answer is: " + jsonRes);
         document.getElementsByClassName("answerTextAskMain")[0].innerHTML = "Answer: " + jsonRes;
         _this.setState({passageAnswer: jsonRes});
         console.log(jsonRes);
        })
        .catch(err => {
            console.log(err);
            this.forceUpdate();
            message.error(err);
        });
      }
    });
    this.forceUpdate();
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const answer = this.state.passageAnswer;

    return (
      <div className="askWrapperMain">
        <Form onSubmit={this.handleSubmit}>
          <Form.Item>
            {getFieldDecorator('question', {
              rules: [{ required: true, message: 'Input a Question' }],
            })(
              <Input className="questionTextInputMain"
              size="large"
              autoComplete="off"
              prefix={<Icon type="question-circle" 
              style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Write your question" />
            )}
          </Form.Item>

          {/* The input elements below are necessary for submission and are automatically filled,
              so we hide them in the UI. The result is rendered in one input form below,
              but it looks better to show that answer as a message.
          */}

          <Form.Item>
            {getFieldDecorator('passage', {
              initialValue: this.props.entryText,
              rules: [{ required: true, message: 'Passage of text' }],
            })(
              <Input className="passageTextDisabled" 
              prefix={<Icon type="diff" style={{ color: 'rgba(0,0,0,.25)' }} />} disabled={true}/>
            )}
          </Form.Item>

          <Form.Item>
            {getFieldDecorator('passageResult', {
              initialValue: this.state.passageAnswer,
              rules: [{ required: true, message: 'The answer will be here' }],
            })(
              <Input 
              className="passageTextDisabled"
              prefix={<Icon type="diff" style={{  color: 'rgba(0,0,0,.25)'}} />} disabled={true} placeholder="Answer will be here"/>
            )}
          </Form.Item>

          <Form.Item>
            <Button type="ghost" icon="radar-chart" className="floatingAskButtonMain" htmlType="submit" >
              Ask Frame
            </Button>
          </Form.Item>

          <p className="answerTextAskMain">
          </p>

          <p className="smallDetailTextAskMain">
              You'll have to hit the Ask button once first to send the text corpus. If nothing is happening still after, then the Python NLP server must not be running or is down!
          </p>
        </Form>
      </div>
    );
  }
}