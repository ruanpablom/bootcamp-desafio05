import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';

import api from '../../services/api';

import Container from '../../components/Container';
import {
  Loading,
  Owner,
  IssueList,
  IssueStateButton,
  Pagination,
} from './styles';

const PER_PAGE = 30;

export default class Repository extends Component {
  state = {
    repository: {},
    issues: [],
    loading: true,
    issueState: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { issueState, page } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: issueState,
          per_page: PER_PAGE,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async handleIssueState(issueState) {
    const { repository } = this.state;

    this.setState({ issueState, page: 1 });

    const issues = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state: issueState,
        per_page: PER_PAGE,
      },
    });

    this.setState({ issues: issues.data });
  }

  async handlePagination(next) {
    const { page, issueState, repository } = this.state;
    let newPage = next ? page + 1 : page - 1;
    newPage = newPage < 1 ? 1 : newPage;

    const issues = await api.get(`/repos/${repository.full_name}/issues`, {
      params: {
        state: issueState,
        per_page: PER_PAGE,
        page: newPage,
      },
    });
    console.log(newPage);
    this.setState({ issues: issues.data, page: newPage });
  }

  render() {
    const { repository, issues, loading, issueState, page } = this.state;
    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueStateButton
          type="button"
          active={issueState === 'open' ? 1 : 0}
          onClick={() => this.handleIssueState('open')}
        >
          ABERTO
        </IssueStateButton>
        <IssueStateButton
          type="button"
          active={issueState === 'closed' ? 1 : 0}
          onClick={() => this.handleIssueState('closed')}
        >
          FECHADO
        </IssueStateButton>
        <IssueStateButton
          type="button"
          active={issueState === 'all' ? 1 : 0}
          onClick={() => this.handleIssueState('all')}
        >
          TODOS
        </IssueStateButton>
        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          {page !== 1 && (
            <button type="button" onClick={() => this.handlePagination(false)}>
              <FaArrowLeft />
            </button>
          )}
          <button type="button" onClick={() => this.handlePagination(true)}>
            <FaArrowRight />
          </button>
        </Pagination>
      </Container>
    );
  }
}

Repository.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string,
    }),
  }).isRequired,
};
